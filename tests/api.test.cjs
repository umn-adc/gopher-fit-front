require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createApiClient,
  ApiError,
  StaleSessionError,
  allPages,
  pagePath,
} = require("../lib/api.ts");
const pair = (token = "first", ttl = 900) => ({
  token,
  refresh_token: `${token}-refresh`,
  expires_in: ttl,
  user_id: 1,
  username: "first",
  token_type: "Bearer",
});
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });
const login = (c) => c.login("first", "Password1!");

test("concurrent expired requests share one refresh and atomically replace credentials", async () => {
  let refreshes = 0;
  const headers = [];
  const c = createApiClient("http://test", async (url, options) => {
    if (url.endsWith("/login")) return json(pair("first", 0));
    if (url.endsWith("/refresh")) {
      refreshes++;
      assert.deepEqual(JSON.parse(options.body), {
        refresh_token: "first-refresh",
      });
      await new Promise((r) => setTimeout(r, 15));
      return json(pair("second"));
    }
    headers.push(options.headers.Authorization);
    return json({ ok: true });
  });
  await login(c);
  await Promise.all(Array.from({ length: 12 }, () => c.request("/profile/")));
  assert.equal(refreshes, 1);
  assert.deepEqual(new Set(headers), new Set(["Bearer second"]));
  assert.equal(c.getSession().refresh_token, "second-refresh");
});
test("lost refresh response clears login and never resends consumed token", async () => {
  let refreshes = 0;
  const c = createApiClient("http://test", async (url) => {
    if (url.endsWith("/login")) return json(pair("first", 0));
    refreshes++;
    throw new TypeError("network lost");
  });
  await login(c);
  await assert.rejects(c.request("/profile/"));
  await assert.rejects(c.request("/profile/"));
  assert.equal(refreshes, 1);
  assert.equal(c.getSession(), null);
});
test("ordinary login and incorrect confirmation 401s never refresh or clear an existing session", async () => {
  let requests = 0;
  const c = createApiClient("http://test", async (url) => {
    requests++;
    return url.endsWith("/login")
      ? json(pair())
      : json(
          {
            error: url.includes("/password")
              ? "Incorrect Password"
              : "Invalid credentials",
          },
          401,
        );
  });
  await login(c);
  await assert.rejects(
    c.request("/profile/password", { method: "PUT", body: {} }),
    { status: 401 },
  );
  await assert.rejects(
    c.request("/auth/account", { method: "DELETE", body: {} }),
    { status: 401 },
  );
  assert.ok(c.getSession());
  assert.equal(requests, 3);
});
test("invalid access token refresh is bounded to one replay; revoked session clears login", async () => {
  let reads = 0,
    refreshes = 0;
  const c = createApiClient("http://test", async (url) => {
    if (url.endsWith("/login")) return json(pair());
    if (url.endsWith("/refresh")) {
      refreshes++;
      return json(pair("second"));
    }
    reads++;
    return json({ error: "Invalid JWT token" }, 401);
  });
  await login(c);
  await assert.rejects(c.request("/profile/"), { status: 401 });
  assert.equal(refreshes, 1);
  assert.equal(reads, 2);
  assert.equal(c.getSession(), null);
});
test("late data and late refresh cannot repopulate a switched or signed-out account", async () => {
  let release;
  const c = createApiClient("http://test", async (url) =>
    url.endsWith("/login")
      ? json(pair())
      : new Promise((r) => {
          release = () => r(json({ private: true }));
        }),
  );
  await login(c);
  const pending = c.request("/profile/");
  c.clearSession();
  await login(c);
  release();
  await assert.rejects(pending, StaleSessionError);
  let finish;
  const d = createApiClient("http://test", async (url) =>
    url.endsWith("/login")
      ? json(pair("first", 0))
      : new Promise((r) => {
          finish = () => r(json(pair("old")));
        }),
  );
  await login(d);
  const refresh = d.request("/profile/");
  d.clearSession();
  finish();
  await assert.rejects(refresh, StaleSessionError);
  assert.equal(d.getSession(), null);
});
test("204, JSON error envelope, request ID, 400/404/409/429/5xx, and Retry-After", async () => {
  let count = 0;
  const c = createApiClient("http://test/", async (url) => {
    count++;
    if (url.endsWith("/login")) return json(pair());
    if (url.endsWith("/empty")) return new Response(null, { status: 204 });
    const status = Number(url.split("/").at(-1));
    return json({ error: "Expected failure" }, status, {
      "X-Request-ID": "request-123",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    });
  });
  await login(c);
  assert.equal(
    await c.request("/empty", { method: "PUT", body: {} }),
    undefined,
  );
  for (const status of [400, 404, 409, 429, 500, 503])
    await assert.rejects(
      c.request(`/${status}`),
      (e) =>
        e instanceof ApiError &&
        e.status === status &&
        e.requestId === "request-123",
    );
  const before = count;
  await assert.rejects(c.request("/429"), (e) => e.retryAt > Date.now());
  assert.equal(count, before);
});
test("uncertain writes are not retried", async () => {
  let writes = 0;
  const c = createApiClient("http://test", async (url) => {
    if (url.endsWith("/login")) return json(pair());
    writes++;
    throw new TypeError("lost response");
  });
  await login(c);
  await assert.rejects(
    c.request("/nutrition/meals", { method: "POST", body: {} }),
    /reload/i,
  );
  assert.equal(writes, 1);
});
test("array pagination reads beyond 100 and an empty final page for exact multiples", async () => {
  for (const length of [0, 50, 100, 200, 251]) {
    const offsets = [];
    const data = Array.from({ length }, (_, id) => id);
    const actual = await allPages(async (path) => {
      const u = new URL(path, "http://test");
      const offset = Number(u.searchParams.get("offset"));
      offsets.push(offset);
      return data.slice(offset, offset + 100);
    }, "/workouts/?start=2026-09-21T00%3A00%3A00%2B05%3A00");
    assert.deepEqual(actual, data);
    assert.equal(offsets.length, Math.floor(length / 100) + 1);
  }
  assert.equal(pagePath("/profile/", 0), "/profile/?limit=50&offset=0");
  await assert.rejects(
    allPages(async (path) => {
      if (path.includes("offset=100")) throw new Error("page failed");
      return Array(100).fill(1);
    }, "/nutrition/meals"),
    /page failed/,
  );
});

test("a public recovery response cannot clear or affect a newly switched session", async () => {
  let release;
  const c = createApiClient("http://test", async (url) =>
    url.endsWith("/login")
      ? json(pair())
      : new Promise((r) => {
          release = () => r(new Response(null, { status: 204 }));
        }),
  );
  const pending = c.request("/auth/recovery/reset", {
    public: true,
    method: "POST",
    body: {},
  });
  await login(c);
  release();
  await assert.rejects(pending, StaleSessionError);
  assert.ok(c.getSession());
});
