require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  inchesToCm,
  poundsToKg,
  workoutSummary,
  nutritionTotals,
} = require("../lib/fitness.ts");

test("onboarding imperial measurements convert to the backend's whole metric units", () => {
  assert.equal(inchesToCm("70"), "178");
  assert.equal(poundsToKg("170"), "77");
  assert.equal(inchesToCm("65.5"), "166");
  for (const value of ["", " ", "-1", "0", "Infinity", "abc", "10000"]) {
    assert.throws(() => inchesToCm(value));
    assert.throws(() => poundsToKg(value));
  }
});

test("streaks count distinct local days through DST and ignore unknown and future dates", () => {
  process.env.TZ = "America/Chicago";
  const now = new Date("2026-03-09T09:00:00-05:00");
  const rows = [
    {
      occurred_at: "2026-03-07T22:00:00-06:00",
      items: [{ duration_minutes: 10 }],
    },
    {
      occurred_at: "2026-03-08T08:00:00-05:00",
      items: [{ duration_minutes: 20 }],
    },
    {
      occurred_at: "2026-03-08T21:00:00-05:00",
      items: [{ duration_minutes: 30 }],
    },
    { occurred_at: null },
    { occurred_at: "not-a-date" },
    { occurred_at: "2026-03-10T08:00:00-05:00" },
  ];
  let summary = workoutSummary(rows, now);
  assert.equal(summary.streak, 2, "yesterday's streak remains active today");
  assert.equal(summary.longest, 2);
  assert.equal(summary.total, 6);
  assert.equal(summary.minutes, 60, "without overall minutes, sum exercises");
  assert.equal(summary.today.length, 0);
  summary = workoutSummary([...rows, { occurred_at: now.toISOString() }], now);
  assert.equal(summary.streak, 3);
  assert.equal(
    summary.longest,
    3,
    "future workouts cannot unlock a streak badge",
  );
  assert.equal(summary.today.length, 1);
  assert.equal(
    workoutSummary(rows, new Date("2026-03-12T09:00:00-05:00")).streak,
    0,
  );
  // A recorded overall duration replaces the exercise sum for that workout.
  const timed = [{ ...rows[0], duration_minutes: 45 }, ...rows.slice(1)];
  assert.equal(workoutSummary(timed, now).minutes, 95);
  const zero = [{ ...rows[0], duration_minutes: 0 }, ...rows.slice(1)];
  assert.equal(workoutSummary(zero, now).minutes, 50);
});

test("dashboard macros total all today's items without including other days", () => {
  assert.deepEqual(
    nutritionTotals(
      [
        {
          date: "2026-09-28",
          total_calories: 500,
          items: [{ protein: 30, carbs: 40, fat: 20 }],
        },
        { date: "2026-09-28", total_calories: 25 },
        {
          date: "2026-09-27",
          total_calories: 900,
          items: [{ protein: 99, carbs: 99, fat: 99 }],
        },
      ],
      "2026-09-28",
    ),
    { calories: 525, protein: 30, carbs: 40, fat: 20 },
  );
});
