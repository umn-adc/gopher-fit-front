require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mealInput, workoutInput } = require("../lib/writes.ts");
const {
  password,
  numberValue,
  dateValue,
  timeValue,
  timestamp,
  localDate,
  weekBounds,
} = require("../lib/validation.ts");
const { dailyTotals, progressWidth } = require("../lib/stats.ts");
test("parent editors omit destructive nested lists, authoritative totals, and unchanged timestamps", () => {
  const meal = mealInput({
    meal_type: "Lunch",
    date: "2026-09-27",
    time: "",
    items: [],
    total_calories: 800,
  });
  assert.deepEqual(meal, { meal_type: "Lunch", date: "2026-09-27", time: "" });
  const original = { id: 1, occurred_at: null, items: [{ id: 8 }] };
  assert.deepEqual(
    workoutInput(
      { workout_name: "Renamed", duration: "30", occurred_at: "" },
      original,
    ),
    { workout_name: "Renamed", duration: 30 },
  );
  const known = { ...original, occurred_at: "2026-09-27T12:00:00Z" };
  assert.equal(
    workoutInput(
      { workout_name: "Lift", duration: "30", occurred_at: "" },
      known,
    ).occurred_at,
    null,
  );
  assert.equal(
    workoutInput(
      { workout_name: "Lift", duration: "30", occurred_at: known.occurred_at },
      known,
    ).occurred_at,
    undefined,
  );
  assert.equal(
    workoutInput({ workout_name: "Lift", duration: "0", occurred_at: "" })
      .occurred_at,
    null,
  );
});
test("numeric/date/time/password validation matches service constraints", () => {
  assert.equal(numberValue("12.5", "Weight", false), 12.5);
  for (const value of ["-1", "1.5", "Infinity", "", "9007199254740992"])
    assert.throws(() => numberValue(value, "Sets"));
  for (const value of ["2025-02-29", "2026-04-31", "0000-01-01"])
    assert.throws(() => dateValue(value));
  assert.equal(dateValue("2024-02-29"), "2024-02-29");
  assert.throws(() => timeValue("24:00"));
  assert.equal(timeValue("23:59:59"), "23:59:59");
  for (const value of [
    "2026-09-27",
    "2026-09-27T12:00:00",
    "2026-02-31T12:00:00Z",
  ])
    assert.throws(() => timestamp(value));
  assert.equal(
    timestamp("2026-09-27T08:30:00-05:00"),
    "2026-09-27T08:30:00-05:00",
  );
  assert.equal(password("old"), "old");
  assert.throws(() => password("old", true));
  assert.equal(password("Password1!", true), "Password1!");
  assert.throws(() => password("é".repeat(37)));
  assert.throws(() => password("Password\t1!", true));
});
test("totals compare local meal date strings; server calories and missing children are supported", () => {
  assert.deepEqual(
    dailyTotals(
      [
        { date: "2026-09-27", total_calories: 350, items: [{ protein: 12 }] },
        { date: "2026-09-27", total_calories: 0 },
        { date: "2026-09-26", total_calories: 900, items: [{ protein: 99 }] },
      ],
      "2026-09-27",
    ),
    { calories: 350, protein: 12 },
  );
  assert.equal(progressWidth(500, 0), 0);
  assert.equal(progressWidth(500, null), 0);
  assert.equal(progressWidth(500, 100), 150);
  assert.equal(progressWidth(10, 100), 15);
});
test("local weeks start Monday, end next Monday, and account for DST", () => {
  process.env.TZ = "America/Chicago";
  const b = weekBounds(new Date("2026-03-08T12:00:00-05:00"));
  assert.deepEqual(b, {
    start: "2026-03-02T06:00:00.000Z",
    end: "2026-03-09T05:00:00.000Z",
  });
  assert.equal(localDate(new Date("2026-09-28T01:00:00Z")), "2026-09-27");
});
