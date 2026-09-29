// Optional Playwright tooling lives outside the app. See README.md.
require("./register-typescript.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createApiClient } = require("../lib/api.ts");
const { localDate } = require("../lib/validation.ts");
const base = "http://127.0.0.1:3000";
const web = "http://127.0.0.1:8081";
const artifacts = process.env.DESIGN_ARTIFACTS || "/tmp/gopher-fit-visual";
const password = "Password1!";
const username = "design" + Date.now();
const api = createApiClient(base);
const button = (page, name) => page.getByRole("button", { name, exact: true });
const field = (page, name) =>
  page.getByLabel(name, { exact: true }).filter({ visible: true });

async function main() {
  assert.deepEqual(await (await fetch(base + "/__test__/fixture")).json(), {
    disposable: true,
  });
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await api.register({
      username,
      password,
      name: "Victor",
      age: 24,
      gender: "Male",
      height: 178,
      weight: 70,
      activity_level: "Very Active",
      sports: ["Taekwondo", "Parkour"],
      goals: ["Build Muscle", "Improve Flexibility", "Athletic Performance"],
    });
    await api.request("/nutrition/macros", {
      method: "PUT",
      body: {
        calories_target: 6133,
        protein_target: 124,
        carbs_target: 250,
        fat_target: 65,
      },
    });
    const meal = await api.request("/nutrition/meals", {
      method: "POST",
      body: { meal_type: "Lunch", date: localDate(), time: "12:00" },
    });
    await api.request(`/nutrition/meals/${meal.id}/items`, {
      method: "POST",
      body: {
        name: "Lunch",
        calories: 1847,
        protein: 120,
        carbs: 210,
        fat: 55,
      },
    });
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const workout = await api.request("/workouts/", {
        method: "POST",
        body: {
          workout_name: i === 0 ? "Strength Training" : "Cardio & Conditioning",
          duration: 45,
          occurred_at: date.toISOString(),
        },
      });
      for (const [exercise, minutes] of i === 0
        ? [
            ["Barbell Squat", 15],
            ["Romanian Deadlift", 15],
            ["Leg Press", 15],
          ]
        : [["Treadmill Run", 30]]) {
        await api.request(`/workouts/${workout.id}/items`, {
          method: "POST",
          body: {
            exercise_name: exercise,
            sets: 3,
            reps: 10,
            weight: i === 0 ? 185 : 0,
            duration_minutes: minutes,
          },
        });
      }
    }
    const context = await browser.newContext({
      viewport: { width: 440, height: 956 },
      timezoneId: "America/Chicago",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const screenshot = async (name) => {
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(350); // Capture the settled modal/scroll state.
      await page.screenshot({
        path: path.join(artifacts, name + ".png"),
        fullPage: true,
      });
    };
    const tab = async (name) => {
      await page.getByRole("tab", { name: new RegExp(name) }).click();
      await page.waitForTimeout(350); // Wait for the native-stack/tab transition.
    };
    const response = await page.goto(web + "/login");
    assert.equal(response.status(), 200, "Direct /login directory route works");
    await field(page, "Username").waitFor();
    await screenshot("login");
    await page
      .getByRole("link", { name: "Create an account", exact: true })
      .click();
    await button(page, "Continue").waitFor();
    await screenshot("onboarding-1");
    await button(page, "Continue").click();
    await button(page, "Continue").click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Name must contain" })
      .waitFor();
    await screenshot("onboarding-2");
    await field(page, "Name").fill("Victor");
    await button(page, "Back").click();
    await button(page, "Continue").click();
    assert.equal(
      await field(page, "Name").inputValue(),
      "Victor",
      "Back preserves onboarding input",
    );
    await button(page, "Continue").click();
    await screenshot("onboarding-3");
    await field(page, "Age").fill("24");
    await button(page, "Continue").click();
    await screenshot("onboarding-4");
    await field(page, "Height (inches)").fill("70");
    await field(page, "Weight (lbs)").fill("170");
    await button(page, "Continue").click();
    await button(page, "Male").click();
    await screenshot("onboarding-5");
    await button(page, "Continue").click();
    await screenshot("onboarding-6");
    await button(page, "Hockey").click();
    await button(page, "Continue").click();
    await screenshot("onboarding-7");
    await button(page, "Build Muscle").click();
    await button(page, "Continue").click();
    await button(page, "Very Active").click();
    await screenshot("onboarding-8");
    await button(page, "Get Started").click();
    await page
      .getByRole("link", { name: "Already have an account? Log in" })
      .click();
    await field(page, "Username").fill(username);
    await field(page, "Password").fill(password);
    await button(page, "Log in").click();
    await page.getByText("Hi, Victor! 👋", { exact: true }).waitFor();
    await page.getByText("1,847", { exact: true }).waitFor();

    for (const width of [423, 320, 1100]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of [
        "Home",
        "Workouts",
        "Social",
        "Profile",
        "Nutrition",
      ]) {
        await tab(name);
        if (name === "Home")
          await page.getByText("1,847", { exact: true }).waitFor();
        const content = page
          .getByTestId("screen-content")
          .filter({ visible: true })
          .last();
        const overflow = await content.evaluate((node) => ({
          width: node.clientWidth,
          scroll: node.scrollWidth,
        }));
        assert.ok(
          overflow.scroll <= overflow.width + 1,
          `${name} has horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`,
        );
        await screenshot(`${name.toLowerCase()}-${width}`);
      }
    }
    await page.setViewportSize({ width: 423, height: 900 });
    await tab("Social");
    await tab("Rankings");
    await field(page, "Exercise").fill("Barbell Squat");
    await button(page, "Show leaderboard").click();
    await page.getByText(new RegExp(`#1 ${username}`)).waitFor();
    await screenshot("rankings-mobile");
    await tab("Friends");
    await screenshot("friends-mobile");
    await button(page, "Manage requests and blocks").click();
    await page.getByText("Incoming requests", { exact: true }).waitFor();
    await button(page, "Hide requests and blocks").click();

    await tab("Workouts");
    await button(page, "Quick start Upper Body").click();
    assert.equal(await field(page, "Workout name").inputValue(), "Upper Body");
    assert.ok(
      await field(
        page,
        "When (timestamp with timezone, or blank for unknown)",
      ).inputValue(),
    );
    await page.waitForFunction(() => {
      const input = document.querySelector('input[aria-label="Workout name"]');
      const bounds = input?.getBoundingClientRect();
      return bounds && bounds.y >= 0 && bounds.y < 800;
    });
    const editBox = await field(page, "Workout name").boundingBox();
    assert.ok(
      editBox.y >= 0 && editBox.y < 800,
      "Quick Start brings its editor into view",
    );
    await button(page, "Cancel workout edit").click();

    await page.setViewportSize({ width: 320, height: 740 });
    for (let i = 0; i < 2; i++) {
      await tab("Home");
      await button(page, "Achievements").click();
      await page.getByText("Your Achievements", { exact: true }).waitFor();
      const closeBox = await button(page, "Close").boundingBox();
      assert.ok(
        closeBox.y >= 0 && closeBox.y + closeBox.height < 740,
        "Modal close is reachable on a small screen",
      );
      await screenshot("achievements-small");
      await button(page, "Close").click();
    }
    await tab("Home");
    await button(page, "Find Workout Buddy").click();
    await page.getByText("Workout Buddies", { exact: true }).waitFor();
    await tab("Home");
    await button(page, "Scan at RecWell").click();
    await button(page, "Got it").click();
    assert.deepEqual(errors, [], "No browser runtime errors");
    console.log(
      `PASS design interactions and mobile/desktop layouts; screenshots in ${artifacts}`,
    );
  } finally {
    if (api.getSession())
      await api
        .request("/auth/account", { method: "DELETE", body: { password } })
        .catch(() => {});
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
