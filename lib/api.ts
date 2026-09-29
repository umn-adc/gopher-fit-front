import type { AuthResponse, RegisterInput } from "./api-types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public requestId?: string,
    public retryAt?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export class StaleSessionError extends Error {}
export type Session = AuthResponse & { expiresAt: number; generation: number };
// Native builds keep only the refresh token here (lib/credentials.ts). Web has no
// store, so its credentials stay in memory.
export type CredentialStore = {
  load(): Promise<string | null>;
  save(refreshToken: string): Promise<void>;
  clear(): Promise<void>;
};
type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  public?: boolean;
  signal?: AbortSignal;
};
const invalidSessionMessages = new Set([
  "Invalid JWT token",
  "Session expired or revoked",
  "Requires Bearer JWT token",
]);

// One client per app, with in-memory credentials and exactly one refresh in flight.
// The factory also lets focused tests use isolated clients and a fake transport.
export function createApiClient(
  baseUrl: string,
  transport: typeof fetch = fetch,
) {
  let session: Session | null = null;
  let generation = 0;
  let refreshFlight: Promise<void> | null = null;
  let notice = "";
  const listeners = new Set<() => void>();
  const cooldowns = new Map<string, number>();
  let credentials: CredentialStore | undefined;
  let stored: Promise<void> = Promise.resolve();
  const emit = () => listeners.forEach((listener) => listener());
  // Store writes run in order, so the last write is always the newest token or a clear.
  function persist(refreshToken: string | null) {
    const store = credentials;
    if (!store) return;
    stored = stored
      .then(() => (refreshToken ? store.save(refreshToken) : store.clear()))
      .catch(() => {});
  }
  const assertCurrent = (expected: number) => {
    if (expected !== generation) throw new StaleSessionError("Session changed");
  };
  function clearSession(message = "") {
    generation += 1;
    session = null;
    refreshFlight = null;
    notice = message;
    persist(null);
    emit();
  }
  function setSession(value: AuthResponse) {
    generation += 1;
    session = {
      ...value,
      expiresAt: Date.now() + value.expires_in * 1000,
      generation,
    };
    refreshFlight = null;
    notice = "";
    persist(value.refresh_token);
    emit();
  }
  function bucket(path: string) {
    if (path.startsWith("/auth/recovery")) return "recovery";
    if (path.startsWith("/auth/") || path === "/profile/password")
      return "auth";
    return path.split("?")[0];
  }
  async function send<T>(
    path: string,
    options: Options,
    token?: string,
  ): Promise<T> {
    if (!/^https?:\/\//.test(baseUrl))
      throw new ApiError(
        "Set EXPO_PUBLIC_API_URL to a reachable API address, then restart the app.",
      );
    const retryAt = cooldowns.get(bucket(path));
    if (retryAt && retryAt > Date.now())
      throw new ApiError(
        "Too many requests. Please wait before trying again.",
        429,
        undefined,
        retryAt,
      );
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 20000);
    let response: Response;
    try {
      response = await transport(baseUrl.replace(/\/+$/, "") + path, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(options.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      if (response.status === 204) return undefined as T;
      const raw = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }
      const requestId = response.headers.get("X-Request-ID") ?? undefined;
      if (!response.ok) {
        const retry = response.headers.get("Retry-After");
        const until = retry
          ? /^\d+$/.test(retry)
            ? Date.now() + Number(retry) * 1000
            : Date.parse(retry)
          : undefined;
        if (until && Number.isFinite(until)) cooldowns.set(bucket(path), until);
        const message =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "The server could not complete this request.";
        throw new ApiError(message, response.status, requestId, until);
      }
      if (data === null)
        throw new ApiError(
          "The server returned an unreadable response. Reload to check whether your change was saved.",
          response.status,
          requestId,
        );
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (options.signal?.aborted)
        throw new StaleSessionError("Request cancelled");
      throw new ApiError(
        options.method && options.method !== "GET"
          ? "Could not confirm the change. Check your connection and reload the data before submitting again."
          : "Could not reach the server. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  }
  function refresh(expected: number): Promise<void> {
    assertCurrent(expected);
    if (refreshFlight) return refreshFlight;
    const current = session;
    if (!current)
      return Promise.reject(new ApiError("Please log in again.", 401));
    const flight = (async () => {
      try {
        const pair = await send<AuthResponse>("/auth/refresh", {
          method: "POST",
          body: { refresh_token: current.refresh_token },
          public: true,
        });
        assertCurrent(expected);
        // Replace both tokens in one assignment. Never reuse the consumed token.
        session = {
          ...pair,
          expiresAt: Date.now() + pair.expires_in * 1000,
          generation,
        };
        persist(pair.refresh_token);
        emit();
      } catch (error) {
        if (generation === expected)
          clearSession(
            "Your session could not be renewed. Please log in again.",
          );
        throw error;
      }
    })();
    refreshFlight = flight;
    void flight
      .finally(() => {
        if (refreshFlight === flight) refreshFlight = null;
      })
      .catch(() => {});
    return flight;
  }
  async function request<T>(path: string, options: Options = {}): Promise<T> {
    const expected = generation;
    if (options.public) {
      const data = await send<T>(path, options);
      assertCurrent(expected);
      return data;
    }
    if (!session) throw new ApiError("Please log in again.", 401);
    const margin = Math.min(30000, session.expires_in * 100);
    if (Date.now() >= session.expiresAt - margin) await refresh(expected);
    assertCurrent(expected);
    const usedToken = session!.token;
    try {
      const data = await send<T>(path, options, usedToken);
      assertCurrent(expected);
      return data;
    } catch (error) {
      assertCurrent(expected);
      if (
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        !invalidSessionMessages.has(error.message)
      )
        throw error;
      if (error.message === "Session expired or revoked") {
        clearSession("Your session ended. Please log in again.");
        throw error;
      }
      // A 401 from authentication is definitive: the handler has not performed a write.
      // Password-confirmation/login 401s never reach this branch.
      if (session?.token === usedToken) await refresh(expected);
      assertCurrent(expected);
      try {
        const data = await send<T>(path, options, session!.token);
        assertCurrent(expected);
        return data;
      } catch (retryError) {
        assertCurrent(expected);
        if (
          retryError instanceof ApiError &&
          retryError.status === 401 &&
          invalidSessionMessages.has(retryError.message)
        )
          clearSession("Your session ended. Please log in again.");
        throw retryError;
      }
    }
  }
  // Exchanges a stored refresh token for a new pair at launch. A failure clears it
  // (an uncertain refresh may already have consumed the token), except a 429,
  // which the rate limiter returns before the refresh handler runs.
  let restoreFlight: Promise<void> | null = null;
  // Single flight: a second concurrent refresh of the same token would be treated
  // as reuse and revoke the session.
  function restore() {
    restoreFlight ??= restoreStored();
    return restoreFlight;
  }
  async function restoreStored() {
    const store = credentials;
    if (!store || session) return;
    const expected = generation;
    let refreshToken: string | null = null;
    try {
      refreshToken = await store.load();
    } catch {
      refreshToken = null;
    }
    if (!refreshToken || expected !== generation) return;
    try {
      const pair = await send<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken },
        public: true,
      });
      if (expected === generation) setSession(pair);
    } catch (error) {
      if (expected !== generation) return;
      if (error instanceof ApiError && error.status === 429) {
        notice = errorMessage(error);
        emit();
      } else clearSession("Your saved sign-in has ended. Please log in again.");
    }
  }
  async function authenticate(path: string, body: unknown) {
    const expected = generation;
    const pair = await send<AuthResponse>(path, {
      method: "POST",
      body,
      public: true,
    });
    assertCurrent(expected);
    setSession(pair);
  }
  return {
    request,
    restore,
    setCredentialStore: (store: CredentialStore | undefined) => {
      credentials = store;
    },
    // Resolves once queued store writes finish; lets tests observe persistence.
    flushCredentials: () => stored,
    clearSession,
    getSession: () => session,
    getNotice: () => notice,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    login: (username: string, password: string) =>
      authenticate("/auth/login", { username, password }),
    register: (body: RegisterInput) => authenticate("/auth/register", body),
    updateUsername: (username: string) => {
      if (session) {
        session = { ...session, username };
        emit();
      }
    },
    async logout(all = false) {
      await request<void>(all ? "/auth/logout-all" : "/auth/logout", {
        method: "POST",
      });
      clearSession("You have been logged out.");
    },
  };
}
export const api = createApiClient(process.env.EXPO_PUBLIC_API_URL ?? "");
export const PAGE_SIZE = 50;
export function pagePath(path: string, offset: number, limit = PAGE_SIZE) {
  return `${path}${path.includes("?") ? "&" : "?"}limit=${limit}&offset=${offset}`;
}
export async function allPages<T>(
  read: (path: string) => Promise<T[]>,
  path: string,
  limit = 100,
): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset <= 1000000; offset += limit) {
    const page = await read(pagePath(path, offset, limit));
    result.push(...page);
    if (page.length < limit) return result;
  }
  throw new ApiError(
    "Too many records to load completely. Totals are unavailable.",
  );
}
export function errorMessage(error: unknown) {
  if (error instanceof StaleSessionError) return "";
  if (!(error instanceof Error)) return "Something went wrong. Try again.";
  if (!(error instanceof ApiError)) return error.message;
  let message = error.message;
  if (error.status === 429)
    message = `Too many requests. Try again${error.retryAt ? ` after ${new Date(error.retryAt).toLocaleTimeString()}` : " shortly"}.`;
  if (error.status === 409)
    message += " Reload and check the latest data before trying again.";
  if (error.status >= 500 && error.status !== 503)
    message =
      "The server could not complete this request. Reload to check your data before trying again.";
  return message + (error.requestId ? ` (Request ${error.requestId})` : "");
}
