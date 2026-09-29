require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApiClient } = require("../lib/api.ts");

const pair = (token, ttl = 900) => ({
  token,
  refresh_token: `${token}-refresh`,
  expires_in: ttl,
  user_id: 1,
  username: "athlete",
  token_type: "Bearer",
});
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
// An in-memory stand-in for expo-secure-store with optional latency.
function memoryStore(initial = null, delay = 0) {
  let value = initial;
  const log = [];
  const wait = () => new Promise((r) => setTimeout(r, delay));
  return {
    log,
    get value() {
      return value;
    },
    async load() {
      log.push("load");
      await wait();
      return value;
    },
    async save(token) {
      await wait();
      value = token;
      log.push(`save ${token}`);
    },
    async clear() {
      await wait();
      value = null;
      log.push("clear");
    },
  };
}
function client(transport, store) {
  const c = createApiClient("http://test", transport);
  c.setCredentialStore(store);
  return c;
}

test("only the refresh token is stored, and rotation stores the newest one", async () => {
  const store = memoryStore();
  let refreshes = 0;
  const c = client(async (url) => {
    if (url.endsWith("/login")) return json(pair("first", 0));
    if (url.endsWith("/refresh")) {
      refreshes++;
      return json(pair("second"));
    }
    return json({ ok: true });
  }, store);
  await c.login("athlete", "Password1!");
  await c.flushCredentials();
  assert.equal(store.value, "first-refresh");
  assert.ok(!store.log.some((entry) => entry.includes("first ")));
  await Promise.all([c.request("/profile/"), c.request("/profile/")]);
  await c.flushCredentials();
  assert.equal(refreshes, 1);
  assert.equal(store.value, "second-refresh");
  assert.equal(c.getSession().token, "second", "access token only in memory");
});

test("launch restore exchanges the stored token once and keeps the new pair", async () => {
  const store = memoryStore("saved-refresh", 5);
  const bodies = [];
  const c = client(async (url, options) => {
    assert.ok(url.endsWith("/auth/refresh"));
    bodies.push(JSON.parse(options.body));
    return json(pair("restored"));
  }, store);
  // A strict-mode double effect must not send the same token twice (reuse revokes).
  await Promise.all([c.restore(), c.restore()]);
  await c.flushCredentials();
  assert.deepEqual(bodies, [{ refresh_token: "saved-refresh" }]);
  assert.equal(c.getSession().token, "restored");
  assert.equal(store.value, "restored-refresh");
  await c.restore();
  assert.equal(bodies.length, 1, "restore runs once per launch");
});

test("restore without a stored token stays signed out without a request", async () => {
  const store = memoryStore(null);
  const c = client(async () => assert.fail("no request expected"), store);
  await c.restore();
  assert.equal(c.getSession(), null);
  assert.deepEqual(store.log, ["load"]);
});

test("a rejected or uncertain restore clears the stored token", async () => {
  for (const respond of [
    async () => json({ error: "Invalid refresh token" }, 401),
    async () => {
      throw new TypeError("offline");
    },
    async () => json({ error: "Database operation failed" }, 500),
  ]) {
    const store = memoryStore("stale-refresh");
    const c = client(respond, store);
    await c.restore();
    await c.flushCredentials();
    assert.equal(c.getSession(), null);
    assert.equal(store.value, null);
    assert.match(c.getNotice(), /Please log in again/);
  }
});

test("a throttled restore keeps the unconsumed token for the next launch", async () => {
  const store = memoryStore("kept-refresh");
  const c = client(
    async () =>
      new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Retry-After": "30" },
      }),
    store,
  );
  await c.restore();
  await c.flushCredentials();
  assert.equal(c.getSession(), null);
  assert.equal(store.value, "kept-refresh");
  assert.match(c.getNotice(), /Too many requests/);
});

test("logout, logout-all, local sign-out and revocation clear the stored token", async () => {
  const cases = {
    logout: (c) => c.logout(),
    "logout-all": (c) => c.logout(true),
    // Password change/reset and account deletion end with clearSession.
    "clear session": async (c) => c.clearSession("Password changed."),
    revoked: (c) => assert.rejects(c.request("/profile/")),
  };
  for (const [name, action] of Object.entries(cases)) {
    const store = memoryStore();
    const c = client(async (url) => {
      if (url.endsWith("/login")) return json(pair("first"));
      if (url.includes("/auth/logout"))
        return new Response(null, { status: 204 });
      return json({ error: "Session expired or revoked" }, 401);
    }, store);
    await c.login("athlete", "Password1!");
    await c.flushCredentials();
    assert.equal(store.value, "first-refresh", name);
    await action(c);
    await c.flushCredentials();
    assert.equal(store.value, null, name);
    assert.equal(c.getSession(), null, name);
  }
});

test("a failed refresh during use clears the stored token", async () => {
  const store = memoryStore();
  const c = client(async (url) => {
    if (url.endsWith("/login")) return json(pair("first", 0));
    if (url.endsWith("/refresh"))
      return json({ error: "Invalid refresh token" }, 401);
    return json({ ok: true });
  }, store);
  await c.login("athlete", "Password1!");
  await assert.rejects(c.request("/profile/"));
  await c.flushCredentials();
  assert.equal(store.value, null);
});

test("store writes apply in order even when the store is slow", async () => {
  const store = memoryStore(null, 10);
  const c = client(async () => json(pair("first")), store);
  await c.login("athlete", "Password1!");
  c.clearSession();
  await c.flushCredentials();
  assert.deepEqual(store.log, ["save first-refresh", "clear"]);
  assert.equal(store.value, null);
});

test("without a store (web) credentials stay in memory and restore does nothing", async () => {
  let requests = 0;
  const c = createApiClient("http://test", async () => {
    requests++;
    return json(pair("first"));
  });
  await c.restore();
  assert.equal(requests, 0);
  await c.login("athlete", "Password1!");
  await c.flushCredentials();
  assert.equal(c.getSession().refresh_token, "first-refresh");
});
