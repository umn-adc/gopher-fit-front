// Install Playwright outside the app, then set PLAYWRIGHT_MODULE to that install.
require("./register-typescript.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const { createApiClient } = require("../lib/api.ts");
const base = "http://127.0.0.1:3000";
const web = "http://127.0.0.1:8081";
const pass = "Password1!";
const suffix = Date.now();
const user = "browser" + suffix,
  friend = "friend" + suffix;
const profile = {
  name: "Browser Test",
  gender: "Other",
  activity_level: "Sedentary",
  age: 0,
  height: 0,
  weight: 0,
  goals: null,
  sports: [],
};
const field = (p, label, value) =>
  p.getByRole("textbox", { name: label, exact: true }).fill(value);
const button = (p, name) => p.getByRole("button", { name, exact: true });
async function visible(p, text) {
  await p
    .getByText(text, { exact: true })
    .first()
    .waitFor({ state: "visible" });
}
async function clickRequest(p, label, path, method, status = 200) {
  const [response] = await Promise.all([
    p.waitForResponse(async (r) => {
      if (new URL(r.url()).pathname !== path || r.request().method() !== method)
        return false;
      // A short-lived access token can expire between preflight and the handler.
      // Wait for the client's bounded replay, not the initial auth rejection.
      if (status !== 401 && r.status() === 401) {
        const body = await r.json();
        if (body.error === "Invalid JWT token") return false;
      }
      return true;
    }),
    button(p, label).click(),
  ]);
  assert.equal(response.status(), status, label + " status");
  return response.status() === 204 ? undefined : response.json();
}
async function tab(p, title) {
  await p.getByRole("tab", { name: new RegExp(title) }).click();
}
async function login(p, username, password = pass) {
  await field(p, "Username", username);
  // Password inputs have no textbox role in HTML.
  await p
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill(password);
  await clickRequest(p, "Log in", "/auth/login", "POST");
  await p.getByText(/^Hi, /).first().waitFor({ state: "visible" });
}
async function main() {
  assert.deepEqual(await (await fetch(base + "/__test__/fixture")).json(), {
    disposable: true,
  });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 850 },
    timezoneId: "America/Chicago",
  });
  const p = await context.newPage();
  p.setDefaultTimeout(12000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const b = createApiClient(base);
  await b.register({ ...profile, username: friend, password: pass });
  const bid = b.getSession().user_id;
  try {
    await p.goto(web + "/profile");
    await p.waitForURL("**/login");
    await p.getByRole("link", { name: "Create an account" }).click();
    await button(p, "Continue").click();
    await field(p, "Name", "Browser Athlete");
    await button(p, "Continue").click();
    await field(p, "Age", "24");
    await button(p, "Continue").click();
    await field(p, "Height (inches)", "70");
    await field(p, "Weight (lbs)", "170");
    await button(p, "Continue").click();
    await button(p, "Other").click();
    await button(p, "Continue").click();
    await button(p, "Hockey").click();
    await button(p, "Continue").click();
    await button(p, "Build Muscle").click();
    await button(p, "Continue").click();
    await button(p, "Sedentary").click();
    await button(p, "Get Started").click();
    await field(p, "Username", user);
    await p
      .getByLabel("Password", { exact: true })
      .filter({ visible: true })
      .fill(pass);
    const auth = await clickRequest(
      p,
      "Create account",
      "/auth/register",
      "POST",
      201,
    );
    await p.getByText(/^Hi, /).first().waitFor({ state: "visible" });
    await visible(p, "No target configured");
    await p.screenshot({ path: "/tmp/gopher-home.png", fullPage: true });
    console.log(
      "PASS protected navigation, browser registration, Home empty/missing-goal states",
    );
    await tab(p, "Nutrition");
    await field(p, "Calories (kcal) target", "0");
    await field(p, "Protein (g) target", "100");
    const macrosRoute = base + "/nutrition/macros";
    await p.route(macrosRoute, (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            headers: {
              "X-Request-ID": "browser-server-error",
              "Access-Control-Allow-Origin": web,
              "Access-Control-Expose-Headers": "X-Request-ID, Retry-After",
            },
            body: JSON.stringify({ error: "Test failure" }),
          })
        : route.continue(),
    );
    await clickRequest(p, "Save targets", "/nutrition/macros", "PUT", 500);
    await p.getByText(/browser-server-error/).waitFor({ state: "visible" });
    assert.equal(
      await p
        .getByLabel("Protein (g) target")
        .filter({ visible: true })
        .inputValue(),
      "100",
    );
    await p.unroute(macrosRoute);
    await p.route(macrosRoute, (route) =>
      route.request().method() === "PUT" ? route.abort() : route.continue(),
    );
    await button(p, "Save targets").click();
    await p
      .getByText(/Could not confirm the change/)
      .waitFor({ state: "visible" });
    assert.equal(
      await p
        .getByLabel("Protein (g) target")
        .filter({ visible: true })
        .inputValue(),
      "100",
    );
    await p.unroute(macrosRoute);
    let throttleCalls = 0;
    await p.route(macrosRoute, (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      throttleCalls++;
      return route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: {
          "Retry-After": "1",
          "X-Request-ID": "browser-throttle",
          "Access-Control-Allow-Origin": web,
          "Access-Control-Expose-Headers": "X-Request-ID, Retry-After",
        },
        body: JSON.stringify({ error: "Slow down" }),
      });
    });
    await clickRequest(p, "Save targets", "/nutrition/macros", "PUT", 429);
    await p.getByText(/Too many requests/).waitFor({ state: "visible" });
    await button(p, "Save targets").click();
    assert.equal(throttleCalls, 1);
    await p.unroute(macrosRoute);
    await p.waitForTimeout(1100);
    await clickRequest(p, "Save targets", "/nutrition/macros", "PUT");
    console.log(
      "PASS browser server/offline errors, retained input, request IDs and Retry-After throttling",
    );
    await button(p, "Add meal").click();
    await field(p, "Meal type", "Browser lunch");
    const meal = await clickRequest(
      p,
      "Save meal",
      "/nutrition/meals",
      "POST",
      201,
    );
    await button(p, "Add food").click();
    await field(p, "Food name", "Beans");
    await field(p, "Calories (kcal)", "250");
    await field(p, "Protein (g)", "15");
    const item = await clickRequest(
      p,
      "Save food",
      `/nutrition/meals/${meal.id}/items`,
      "POST",
      201,
    );
    await visible(p, "250 kcal");
    await button(p, "Edit Beans").click();
    await field(p, "Calories (kcal)", "300");
    await clickRequest(
      p,
      "Save food",
      `/nutrition/meals/${meal.id}/items/${item.id}`,
      "PUT",
    );
    await visible(p, "300 kcal");
    await button(p, "Edit meal").click();
    await field(p, "Meal type", "Edited lunch");
    await clickRequest(
      p,
      "Save meal",
      `/nutrition/meals/${meal.id}`,
      "PUT",
      204,
    );
    await visible(p, "300 kcal");
    await tab(p, "Home");
    await visible(p, "Target is zero");
    await p.getByText("300", { exact: true }).waitFor({ state: "visible" });
    console.log(
      "PASS browser macro targets, meal/item create/edit, 204 refetch, refreshed Home totals",
    );
    await tab(p, "Workouts");
    await button(p, "Add workout").click();
    await field(p, "Workout name", "Browser lift");
    const workout = await clickRequest(
      p,
      "Save workout",
      "/workouts/",
      "POST",
      201,
    );
    await p.getByText(/Date unknown/).waitFor({ state: "visible" });
    await button(p, "Add exercise").click();
    await field(p, "Exercise name", "Browser Press");
    await field(p, "Weight (unit unspecified)", "125.5");
    const lift = await clickRequest(
      p,
      "Save exercise",
      `/workouts/${workout.id}/items`,
      "POST",
      201,
    );
    await button(p, "Edit Browser Press").click();
    await field(p, "Weight (unit unspecified)", "130.5");
    await clickRequest(
      p,
      "Save exercise",
      `/workouts/${workout.id}/items/${lift.id}`,
      "PUT",
      204,
    );
    await p.getByText(/Weight 130.5/).waitFor({ state: "visible" });
    await button(p, "Edit workout").click();
    await button(p, "Use current time").click();
    await clickRequest(p, "Save workout", `/workouts/${workout.id}`, "PUT");
    await tab(p, "Social");
    await tab(p, "Rankings");
    await p
      .getByText(/^Browser Press · Weight 130.5/)
      .filter({ visible: true })
      .waitFor({ state: "visible" });
    await field(p, "Exercise", "Browser Press");
    await button(p, "Show leaderboard").click();
    await p.getByText(new RegExp(`#1 ${user}`)).waitFor({ state: "visible" });
    await tab(p, "Friends");
    await field(p, "Friend's user ID", String(bid));
    await button(p, "Look up user").click();
    await visible(p, `${friend} · User ${bid}`);
    await clickRequest(p, "Send request", "/social/friendships", "POST", 201);
    await b.request(`/social/friendships/${auth.user_id}`, {
      method: "PUT",
      body: { user1_id: bid, user2_id: auth.user_id, status: "accepted" },
    });
    await tab(p, "Home");
    await tab(p, "Social");
    await button(p, "Remove friend").waitFor({ state: "visible" });
    console.log(
      "PASS browser workout/item CRUD, date editing, rankings refreshed, friend request/accept with two accounts",
    );
    await tab(p, "Profile");
    await button(p, "Edit profile").click();
    await visible(p, `${user} · Your user ID: ${auth.user_id}`);
    await field(p, "Name", "Updated browser name");
    await clickRequest(p, "Save profile", "/profile/", "PUT");
    await button(p, "Privacy & Security").click();
    await p
      .getByLabel("Current password", { exact: true })
      .filter({ visible: true })
      .fill("wrong");
    await p
      .getByLabel("New password", { exact: true })
      .filter({ visible: true })
      .fill("NewPassword1!");
    await clickRequest(p, "Change password", "/profile/password", "PUT", 401);
    assert.ok(p.url().endsWith("/profile"));
    await p
      .getByRole("link", { name: "Set up recovery or reset your password" })
      .click();
    await field(p, "Recovery email", "browser@example.com");
    await p
      .getByLabel("Current password", { exact: true })
      .filter({ visible: true })
      .fill(pass);
    await clickRequest(
      p,
      "Send verification email",
      "/auth/recovery-address",
      "PUT",
      202,
    );
    let mail = (await (await fetch(base + "/__test__/mail")).json()).at(-1);
    const recoveryPage = await context.newPage();
    recoveryPage.on("pageerror", (e) => errors.push(e.message));
    await recoveryPage.goto(
      web + "/recovery#purpose=verify&token=" + encodeURIComponent(mail.token),
    );
    await button(recoveryPage, "Confirm recovery address").waitFor({
      state: "visible",
    });
    assert.equal(new URL(recoveryPage.url()).hash, "");
    assert.equal(
      await recoveryPage.evaluate(() => window.__gopherRecovery),
      undefined,
    );
    await clickRequest(
      recoveryPage,
      "Confirm recovery address",
      "/auth/recovery-address/confirm",
      "POST",
      204,
    );
    await visible(recoveryPage, "Recovery address confirmed.");
    await field(recoveryPage, "Account username", user);
    await clickRequest(
      recoveryPage,
      "Request recovery email",
      "/auth/recovery/request",
      "POST",
      202,
    );
    mail = (await (await fetch(base + "/__test__/mail")).json()).at(-1);
    await recoveryPage.goto(
      web + "/recovery#purpose=reset&token=" + encodeURIComponent(mail.token),
    );
    await recoveryPage
      .getByLabel("New password", { exact: true })
      .filter({ visible: true })
      .fill("NewPassword1!");
    await clickRequest(
      recoveryPage,
      "Reset password",
      "/auth/recovery/reset",
      "POST",
      204,
    );
    await recoveryPage.waitForURL("**/login");
    await p.getByRole("link", { name: "Back to Profile" }).click();
    await p.waitForURL("**/login");
    console.log(
      "PASS browser profile save, wrong-password retention, fragment stripping, verification/reset under CSP and session revocation",
    );
    await login(p, user, "NewPassword1!");
    await tab(p, "Nutrition");
    await clickRequest(
      p,
      "Delete Beans",
      `/nutrition/meals/${meal.id}/items/${item.id}`,
      "DELETE",
      204,
    );
    await visible(p, "0 kcal");
    await button(p, "Delete meal").click();
    await clickRequest(
      p,
      "Confirm meal deletion",
      `/nutrition/meals/${meal.id}`,
      "DELETE",
      204,
    );
    await visible(p, "No meals yet. Add a meal, then log its food items.");
    await tab(p, "Workouts");
    await clickRequest(
      p,
      "Delete Browser Press",
      `/workouts/${workout.id}/items/${lift.id}`,
      "DELETE",
      204,
    );
    await button(p, "Delete workout").click();
    await clickRequest(
      p,
      "Confirm workout deletion",
      `/workouts/${workout.id}`,
      "DELETE",
      204,
    );
    await tab(p, "Profile");
    await button(p, "Account Settings").click();
    await clickRequest(
      p,
      "Log out all sessions",
      "/auth/logout-all",
      "POST",
      204,
    );
    await p.waitForURL("**/login");
    await login(p, friend);
    await tab(p, "Profile");
    await button(p, "Edit profile").click();
    await visible(p, `${friend} · Your user ID: ${bid}`);
    assert.equal(
      await p
        .getByLabel("Name", { exact: true })
        .filter({ visible: true })
        .inputValue(),
      profile.name,
    );
    await clickRequest(p, "Log out", "/auth/logout", "POST", 204);
    await p.waitForURL("**/login");
    await login(p, user, "NewPassword1!");
    await tab(p, "Profile");
    await button(p, "Privacy & Security").click();
    await p
      .getByLabel("Current password", { exact: true })
      .filter({ visible: true })
      .fill("NewPassword1!");
    await p
      .getByLabel("New password", { exact: true })
      .filter({ visible: true })
      .fill(pass);
    await clickRequest(p, "Change password", "/profile/password", "PUT");
    await p.waitForURL("**/login");
    await login(p, user);
    await tab(p, "Profile");
    await button(p, "Account Settings").click();
    await button(p, "Delete account…").click();
    await p
      .getByLabel("Password to confirm deletion")
      .filter({ visible: true })
      .fill(pass);
    await clickRequest(
      p,
      "Permanently delete my account",
      "/auth/account",
      "DELETE",
      204,
    );
    await p.waitForURL("**/login");
    await login(p, friend);
    await p.reload();
    await p.waitForURL("**/login");
    assert.deepEqual(
      await p.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
      { local: 0, session: 0 },
    );
    console.log(
      "PASS browser deletions, logout/all, switching users, password change, account deletion and memory-only login",
    );
    assert.deepEqual(errors, [], "Browser runtime errors");
    console.log("PASS browser suite");
  } finally {
    // The API client has its own session and only owns the disposable friend account.
    await b
      .request("/auth/account", { method: "DELETE", body: { password: pass } })
      .catch(() => {});
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
