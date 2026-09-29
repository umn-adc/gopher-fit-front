// Focused onboarding regression against the disposable backend and exported web app.
require("./register-typescript.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const { createApiClient } = require("../lib/api.ts");
const base = "http://127.0.0.1:3000";
const web = "http://127.0.0.1:8081";
const username = "onboarding" + Date.now();
const password = "Password1!";
const api = createApiClient(base);

async function main() {
  assert.deepEqual(await (await fetch(base + "/__test__/fixture")).json(), {
    disposable: true,
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 320, height: 740 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const button = (name) => page.getByRole("button", { name, exact: true });
    const field = (name) =>
      page.getByLabel(name, { exact: true }).filter({ visible: true });
    const next = () => button("Continue").click();
    const back = () => button("Back").click();
    const alert = (text) =>
      page.getByRole("alert").filter({ hasText: text }).waitFor();
    const retained = async (name, value) =>
      assert.equal(await field(name).inputValue(), value);
    const step = (number) =>
      page.getByText(`Step ${number} of 8`, { exact: true }).waitFor();
    let registrations = 0;
    await page.route("**/auth/register", async (route) => {
      registrations++;
      // Exercise the actual pending state and submit lock with a slow response.
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.continue();
    });
    await page.goto(web + "/onboarding");
    await step(1);
    for (const width of [320, 423, 1100]) {
      await page.setViewportSize({ width, height: 740 });
      for (const label of ["Back", "Continue"]) {
        const control = button(label);
        const box = await control.boundingBox();
        assert.ok(
          box.height >= 48 && box.width >= 48,
          `${label} has an adequate touch target`,
        );
        assert.equal(await control.isDisabled(), false);
      }
      const background = await button("Continue").evaluate(
        (node) => getComputedStyle(node).backgroundColor,
      );
      assert.equal(
        background,
        "rgb(137, 0, 32)",
        "Continue keeps its maroon background",
      );
    }
    await page.setViewportSize({ width: 320, height: 740 });
    await back();
    await page.waitForURL(/\/login\/?$/);
    await page
      .getByRole("link", { name: "Create an account", exact: true })
      .click();
    await step(1);
    await back();
    await page.waitForURL(/\/login\/?$/);
    await page
      .getByRole("link", { name: "Create an account", exact: true })
      .click();
    await next();
    await step(2);
    await next();
    await alert("Name must contain");
    await field("Name").fill("Web Tester");
    await back();
    await step(1);
    await next();
    await retained("Name", "Web Tester");
    await next();
    await step(3);
    for (const value of ["", "0", "-1", "131", "24.5"]) {
      await field("Age").fill(value);
      await next();
      await alert(value === "0" ? "Enter your age" : "Age must be");
      await step(3);
    }
    await field("Age").fill("24");
    await next();
    await step(4);
    await next();
    await alert("Enter a valid height.");
    await field("Height (inches)").fill("70");
    await field("Weight (lbs)").fill("-2");
    await next();
    await alert("Enter a valid weight.");
    await field("Weight (lbs)").fill("170");
    await next();
    await step(5);
    await back();
    await retained("Height (inches)", "70");
    await retained("Weight (lbs)", "170");
    await back();
    await retained("Age", "24");
    await next();
    await next();
    await next();
    await alert("Choose a gender to continue.");
    await button("Other").click();
    await next();
    await step(6);
    await next();
    await step(7);
    await back();
    await button("Hockey").click();
    await next();
    await next();
    await step(8);
    await back();
    await button("Build Muscle").click();
    await next();
    await button("Get Started").click();
    await alert("Choose your activity level to continue.");
    await button("Moderately Active").click();
    await button("Get Started").click();
    await button("Create account").click();
    await alert("Username must contain");
    await field("Username").fill(username);
    await field("Password").fill("short");
    await button("Create account").click();
    await alert("Use at least seven");
    await field("Password").fill(password);
    await back();
    assert.equal(
      await button("Moderately Active").evaluate(
        (node) => getComputedStyle(node).borderTopColor,
      ),
      "rgb(137, 0, 32)",
    );
    await button("Get Started").click();
    await retained("Username", username);
    await retained("Password", password);
    assert.equal(registrations, 0, "Invalid profiles never reach registration");
    await button("Create account").scrollIntoViewIfNeeded();
    const submitBox = await button("Create account").boundingBox();
    assert.ok(
      submitBox.x >= 0 && submitBox.x + submitBox.width <= 320,
      "Account button fits a narrow screen",
    );
    await button("Create account").click();
    await button("Creating account…").waitFor();
    assert.equal(await button("Creating account…").isDisabled(), true);
    assert.equal(await button("Back").isDisabled(), true);
    await page.getByText("Hi, Web Tester! 👋", { exact: true }).waitFor();
    assert.equal(registrations, 1);
    await api.login(username, password);
    const profile = await api.request("/profile/");
    assert.deepEqual(
      { ...profile, user_id: undefined },
      {
        user_id: undefined,
        name: "Web Tester",
        age: 24,
        gender: "Other",
        height: 178,
        weight: 77,
        activity_level: "Moderately Active",
        sports: ["Hockey"],
        goals: ["Build Muscle"],
        unit_preference: "metric",
        weekly_workout_target: null,
      },
    );
    assert.deepEqual(errors, [], "No browser runtime errors");
    console.log(
      "PASS web onboarding, validation, retained fields, submit lock, registration, and 320/423/1100px buttons",
    );
  } finally {
    if (api.getSession())
      await api.request("/auth/account", {
        method: "DELETE",
        body: { password },
      });
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
