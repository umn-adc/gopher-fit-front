require("./register-typescript.cjs");
const assert = require("node:assert/strict");
const { createApiClient, allPages, ApiError } = require("../lib/api.ts");
const {
  mealInput,
  workoutInput,
  workoutItemInput,
} = require("../lib/writes.ts");
const { dailyTotals } = require("../lib/stats.ts");
const base = process.env.TEST_API_URL || "http://127.0.0.1:3000";
const secret = "Password1!";
const profile = {
  name: "Disposable Test",
  age: 21,
  height: 170,
  weight: 70,
  gender: "Other",
  activity_level: "Sedentary",
  goals: null,
  sports: [],
};
const suffix = Date.now();
const clients = [];
async function register(label) {
  const c = createApiClient(base);
  await c.register({
    ...profile,
    username: `${label}${suffix}`,
    password: secret,
  });
  clients.push(c);
  return c;
}
async function expectStatus(work, status) {
  await assert.rejects(
    work,
    (e) => e instanceof ApiError && e.status === status,
  );
}
async function fixture(path, method = "GET") {
  const r = await fetch(base + "/__test__/" + path, { method });
  assert.ok(r.ok);
  return r.status === 204 ? undefined : r.json();
}
async function main() {
  assert.deepEqual(
    await fixture("fixture"),
    { disposable: true },
    "Refusing to write to a non-fixture backend",
  );
  const a = await register("alice");
  const b = await register("bob");
  const aid = a.getSession().user_id,
    bid = b.getSession().user_id;
  const aName = a.getSession().username;
  assert.equal((await a.request("/profile/")).name, profile.name);
  await expectStatus(a.login(aName, "wrong"), 401);
  assert.ok(a.getSession());
  await expectStatus(
    a.request("/auth/account", {
      method: "DELETE",
      body: { password: "wrong" },
    }),
    401,
  );
  assert.ok(a.getSession());
  await a.request("/profile/", {
    method: "PUT",
    body: { ...profile, name: "Updated", sports: ["Swimming"] },
  });
  const updated = await a.request("/profile/");
  assert.deepEqual(updated.sports, ["Swimming"]);
  assert.equal(updated.goals, null);
  assert.equal(updated.weekly_workout_target, null);
  const targeted = await a.request("/profile/", {
    method: "PUT",
    body: { ...profile, ...updated, weekly_workout_target: 4 },
  });
  assert.equal(targeted.weekly_workout_target, 4);
  await expectStatus(
    a.request("/profile/", {
      method: "PUT",
      body: { ...profile, weekly_workout_target: 15 },
    }),
    400,
  );
  assert.equal((await a.request("/profile/")).weekly_workout_target, 4);
  const renamed = await a.request("/profile/username", {
    method: "PUT",
    body: { username: `renamed${suffix}` },
  });
  a.updateUsername(renamed.username);
  assert.equal(a.getSession().username, renamed.username);
  const secondary = createApiClient(base);
  await secondary.login(renamed.username, secret);
  await expectStatus(a.request("/nutrition/macros"), 404);
  await a.request("/nutrition/macros", {
    method: "PUT",
    body: {
      calories_target: 0,
      protein_target: 150,
      carbs_target: 200,
      fat_target: 60,
    },
  });
  assert.equal((await a.request("/nutrition/macros")).calories_target, 0);
  let meal = await a.request("/nutrition/meals", {
    method: "POST",
    body: {
      date: "2026-09-27",
      meal_type: "Lunch",
      items: [
        { name: "Rice", calories: 200, protein: 5 },
        { name: "Beans", calories: 150, protein: 10 },
      ],
      total_calories: 9999,
    },
  });
  assert.equal(meal.total_calories, 350);
  assert.ok(meal.items.every((i) => i.id > 0));
  await expectStatus(b.request(`/nutrition/meals/${meal.id}`), 404);
  assert.equal(
    await a.request(`/nutrition/meals/${meal.id}`, {
      method: "PUT",
      body: mealInput({ ...meal, meal_type: "Dinner" }),
    }),
    undefined,
  );
  meal = await a.request(`/nutrition/meals/${meal.id}`);
  assert.equal(meal.items.length, 2);
  await a.request(`/nutrition/meals/${meal.id}/items/${meal.items[0].id}`, {
    method: "PUT",
    body: { name: "Rice", calories: 250, protein: 6, carbs: 40, fat: 1 },
  });
  await a.request(`/nutrition/meals/${meal.id}/items/${meal.items[1].id}`, {
    method: "DELETE",
  });
  meal = await a.request(`/nutrition/meals/${meal.id}`);
  assert.equal(meal.total_calories, 250);
  await a.request(`/nutrition/meals/${meal.id}`, {
    method: "PUT",
    body: {
      ...mealInput(meal),
      items: [...meal.items, { name: "New", calories: 20, protein: 1 }],
    },
  });
  meal = await a.request(`/nutrition/meals/${meal.id}`);
  assert.equal(meal.items.length, 2);
  for (let i = 1; i < 200; i++)
    await a.request("/nutrition/meals", {
      method: "POST",
      body: { date: "2026-09-27", meal_type: `Meal ${i}` },
    });
  const paths = [];
  const meals = await allPages((path) => {
    paths.push(path);
    return a.request(path);
  }, "/nutrition/meals");
  assert.equal(meals.length, 200);
  assert.equal(paths.length, 3);
  assert.match(paths[2], /offset=200/);
  assert.deepEqual(dailyTotals(meals, "2026-09-27"), {
    calories: 270,
    protein: 7,
  });
  // Home reads one daily summary instead of every meal page.
  const summary = await a.request("/nutrition/summary?date=2026-09-27");
  assert.equal(summary.calories, 270);
  assert.equal(summary.protein, 7);
  assert.deepEqual(summary.targets, await a.request("/nutrition/macros"));
  const bSummary = await b.request("/nutrition/summary?date=2026-09-27");
  assert.equal(bSummary.calories, 0);
  assert.equal(bSummary.targets, null);
  const dated = await allPages(
    (path) => a.request(path),
    "/nutrition/meals?date=2026-09-27",
  );
  assert.equal(dated.length, 200);
  assert.deepEqual(
    await a.request("/nutrition/meals?date=2026-09-26"),
    [],
    "date filter excludes other days",
  );
  await expectStatus(a.request("/nutrition/summary?date=2026-02-30"), 400);
  await a.request(`/nutrition/meals/${meal.id}`, {
    method: "PUT",
    body: { ...mealInput(meal), items: [] },
  });
  assert.equal(
    (await a.request(`/nutrition/meals/${meal.id}`)).total_calories,
    0,
  );
  await a.request(`/nutrition/meals/${meal.id}`, { method: "DELETE" });
  console.log(
    "PASS profile and weekly target, nutrition CRUD, ownership, full replacement, 200-record pagination, date filter and daily summary, totals, zero/missing targets",
  );
  let workout = await a.request("/workouts/", {
    method: "POST",
    body: {
      workout_name: "Unknown history",
      items: [{ exercise_name: "Bench Press", weight: 300, weight_unit: "kg" }],
    },
  });
  // D1: a positive weight without a unit is rejected.
  await expectStatus(
    a.request("/workouts/", {
      method: "POST",
      body: {
        workout_name: "Unitless",
        items: [{ exercise_name: "Bench Press", weight: 300 }],
      },
    }),
    400,
  );
  // Created with the deprecated unitless duration, as older clients did.
  const known = await a.request("/workouts/", {
    method: "POST",
    body: {
      workout_name: "Boundary",
      duration: 45,
      occurred_at: "2026-09-21T00:00:00-05:00",
    },
  });
  assert.equal(known.duration_minutes, null);
  const minutes = await a.request(`/workouts/${known.id}`, {
    method: "PUT",
    body: workoutInput(
      {
        workout_name: "Boundary",
        duration_minutes: "50",
        occurred_at: known.occurred_at,
      },
      known,
    ),
  });
  assert.equal(minutes.duration_minutes, 50);
  assert.equal(minutes.duration, 45, "legacy duration survives new writes");
  await a.request("/workouts/", {
    method: "POST",
    body: {
      workout_name: "End boundary",
      occurred_at: "2026-09-28T00:00:00-05:00",
    },
  });
  const filtered = await allPages(
    (path) => a.request(path),
    "/workouts/?start=" +
      encodeURIComponent("2026-09-21T00:00:00-05:00") +
      "&end=" +
      encodeURIComponent("2026-09-28T00:00:00-05:00"),
  );
  assert.deepEqual(
    filtered.map((x) => x.id),
    [known.id],
  );
  workout = await a.request(`/workouts/${workout.id}`, {
    method: "PUT",
    body: workoutInput(
      { workout_name: "Renamed", duration_minutes: "30", occurred_at: "" },
      workout,
    ),
  });
  assert.equal(workout.occurred_at, null);
  assert.equal(workout.duration_minutes, 30);
  assert.equal(workout.items.length, 1);
  assert.equal(
    await a.request(`/workouts/${workout.id}/items/${workout.items[0].id}`, {
      method: "PUT",
      body: workoutItemInput({
        exercise_name: "Bench press",
        sets: "3",
        reps: "5",
        weight: "280",
        duration_minutes: "4.5",
        weight_unit: "lb",
      }),
    }),
    undefined,
  );
  // Records are kilograms whatever unit the lift was logged in.
  const [record] = await a.request("/social/muscle-ranks");
  assert.ok(Math.abs(record.max_weight - 280 * 0.45359237) < 1e-9);
  assert.equal(
    (await a.request(`/workouts/${workout.id}`)).items[0].weight_unit,
    "lb",
  );
  await a.request(`/workouts/${workout.id}/items/${workout.items[0].id}`, {
    method: "DELETE",
  });
  assert.deepEqual(await a.request("/social/muscle-ranks"), []);
  const child = await a.request(`/workouts/${workout.id}/items`, {
    method: "POST",
    body: { exercise_name: "Bench press", weight: 300, weight_unit: "kg" },
  });
  assert.ok(child.id);
  await expectStatus(
    b.request(`/workouts/${workout.id}`, { method: "DELETE" }),
    404,
  );
  workout = await a.request(`/workouts/${workout.id}`, {
    method: "PUT",
    body: {
      workout_name: "Nested",
      items: [
        {
          id: child.id,
          exercise_name: "Bench press",
          weight: 300,
          weight_unit: "kg",
        },
        { exercise_name: "Squat", weight: 200, weight_unit: "kg" },
      ],
    },
  });
  assert.equal(workout.items.length, 2);
  assert.ok(workout.items[1].id);
  for (let i = 0; i < 100; i++)
    await a.request("/workouts/", {
      method: "POST",
      body: { workout_name: "History " + i },
    });
  assert.equal(
    (await allPages((path) => a.request(path), "/workouts/")).length,
    103,
  );
  console.log(
    "PASS workout/item CRUD, weight units and kg records, duration_minutes with legacy duration kept, unknown dates, inclusive/exclusive offset boundaries, nested IDs, record recalculation, >100 workouts",
  );
  let relation = await b.request("/social/friendships", {
    method: "POST",
    body: { user1_id: bid, user2_id: aid, status: "pending" },
  });
  assert.equal(relation.user1_id, Math.min(aid, bid));
  assert.equal(relation.action_user_id, bid);
  await expectStatus(
    b.request(`/social/friendships/${aid}`, {
      method: "PUT",
      body: { user1_id: aid, user2_id: bid, status: "accepted" },
    }),
    400,
  );
  await a.request(`/social/friendships/${bid}`, {
    method: "PUT",
    body: { user1_id: aid, user2_id: bid, status: "accepted" },
  });
  assert.equal((await a.request("/social/friendships/accepted")).length, 1);
  await a.request(`/social/friendships/${bid}`, {
    method: "PUT",
    body: { user1_id: aid, user2_id: bid, status: "blocked" },
  });
  await expectStatus(
    b.request(`/social/friendships/${aid}`, { method: "DELETE" }),
    400,
  );
  await a.request(`/social/friendships/${bid}`, { method: "DELETE" });
  const c = await register("carol"),
    d = await register("dave");
  for (const [client, weight] of [
    [b, 200],
    [c, 200],
    [d, 100],
  ])
    await client.request("/workouts/", {
      method: "POST",
      body: {
        workout_name: "Ranked",
        items: [{ exercise_name: "bench PRESS", weight, weight_unit: "kg" }],
      },
    });
  const first = await a.request(
    "/social/leaderboard?exercise=bench%20press&limit=2&offset=0",
  );
  const second = await a.request(
    "/social/leaderboard?exercise=bench%20press&limit=2&offset=2",
  );
  assert.deepEqual(
    [...first, ...second].map((r) => [r.rank, r.percentile]),
    [
      [1, 100],
      [2, 75],
      [2, 75],
      [3, 25],
    ],
  );
  console.log(
    "PASS two-account friendships, forbidden transitions, blocks, tied ranks across pages",
  );
  await fixture("recovery/false", "PUT");
  await expectStatus(
    a.request("/auth/recovery/request", {
      public: true,
      method: "POST",
      body: { username: renamed.username },
    }),
    503,
  );
  await fixture("recovery/true", "PUT");
  await a.request("/auth/recovery-address", {
    method: "PUT",
    body: { password: secret, email: "alice@example.com" },
  });
  let mail = (await fixture("mail")).at(-1);
  await a.request("/auth/recovery-address/confirm", {
    public: true,
    method: "POST",
    body: { token: mail.token },
  });
  await expectStatus(
    a.request("/auth/recovery-address/confirm", {
      public: true,
      method: "POST",
      body: { token: mail.token },
    }),
    400,
  );
  const missing = await a.request("/auth/recovery/request", {
    public: true,
    method: "POST",
    body: { username: "absent" },
  });
  const enrolled = await a.request("/auth/recovery/request", {
    public: true,
    method: "POST",
    body: { username: renamed.username },
  });
  assert.deepEqual(missing, enrolled);
  mail = (await fixture("mail")).at(-1);
  await a.request("/auth/recovery/reset", {
    public: true,
    method: "POST",
    body: { token: mail.token, new_password: "ChangedPass1!" },
  });
  await expectStatus(secondary.request("/profile/"), 401);
  assert.equal(secondary.getSession(), null);
  a.clearSession();
  await a.login(renamed.username, "ChangedPass1!");
  await expectStatus(
    a.request("/auth/recovery/reset", {
      public: true,
      method: "POST",
      body: { token: mail.token, new_password: secret },
    }),
    400,
  );
  console.log(
    "PASS recovery disabled/configured fake-mail enrollment, neutral acknowledgments, reset, consumed tokens and revocation",
  );
  let refreshes = 0;
  const counted = createApiClient(base, (...args) => {
    if (args[0].endsWith("/auth/refresh")) refreshes++;
    return fetch(...args);
  });
  await counted.login(renamed.username, "ChangedPass1!");
  await new Promise((r) => setTimeout(r, 3200));
  await Promise.all(
    Array.from({ length: 8 }, () => counted.request("/profile/")),
  );
  assert.equal(refreshes, 1);
  await counted.logout(true);
  await expectStatus(a.request("/profile/"), 401);
  await a.login(renamed.username, "ChangedPass1!");
  await a.request("/profile/password", {
    method: "PUT",
    body: { old_password: "ChangedPass1!", new_password: secret },
  });
  await expectStatus(a.request("/profile/"), 401);
  await a.login(renamed.username, secret);
  await a.logout();
  assert.equal(a.getSession(), null);
  await a.login(renamed.username, secret);
  await a.request("/auth/account", {
    method: "DELETE",
    body: { password: secret },
  });
  a.clearSession();
  await expectStatus(a.login(renamed.username, secret), 401);
  assert.ok(await b.request("/profile/"));
  for (const client of [b, c, d]) {
    await client.request("/auth/account", {
      method: "DELETE",
      body: { password: secret },
    });
    client.clearSession();
  }
  console.log(
    "PASS actual access expiry, concurrent refresh, logout/all, password revocation and account deletion; all integration checks passed",
  );
}
main().catch((e) => {
  console.error(e.name + ": " + e.message);
  process.exitCode = 1;
});
