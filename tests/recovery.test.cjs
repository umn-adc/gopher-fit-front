require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
test("recovery can load on native where window has no browser APIs", () => {
  const modulePath = require.resolve("../lib/recovery.ts");
  delete require.cache[modulePath];
  global.window = {};
  try {
    const recovery = require(modulePath);
    assert.equal(recovery.readRecoveryLink(), null);
    assert.doesNotThrow(() => recovery.clearRecoveryLink());
  } finally {
    delete global.window;
    delete require.cache[modulePath];
  }
});
test("recovery consumes the bootstrap, strips fragments and handles subsequent links without storage", () => {
  const events = {};
  const location = { pathname: "/recovery", search: "", hash: "" };
  const replaced = [];
  global.window = {
    __gopherRecovery: { purpose: "verify", token: "first-token" },
    location,
    history: {
      replaceState: (_state, _title, path) => {
        replaced.push(path);
        location.hash = "";
      },
    },
    addEventListener: (type, listener) => {
      events[type] = listener;
    },
  };
  const {
    readRecoveryLink,
    clearRecoveryLink,
    subscribeRecoveryLink,
  } = require("../lib/recovery.ts");
  assert.deepEqual(readRecoveryLink(), {
    purpose: "verify",
    token: "first-token",
  });
  assert.equal(window.__gopherRecovery, undefined);
  let updates = 0;
  const unsubscribe = subscribeRecoveryLink(() => updates++);
  location.hash = "#purpose=reset&token=next-token";
  events.hashchange();
  assert.deepEqual(readRecoveryLink(), {
    purpose: "reset",
    token: "next-token",
  });
  assert.deepEqual(replaced, ["/recovery"]);
  assert.equal(location.hash, "");
  clearRecoveryLink();
  assert.equal(readRecoveryLink(), null);
  assert.equal(updates, 2);
  unsubscribe();
  delete global.window;
});
