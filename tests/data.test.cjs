require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  favoriteInput,
  logFavoriteInput,
  mealInput,
  workoutInput,
  workoutItemInput,
} = require("../lib/writes.ts");
const {
  password,
  numberValue,
  dateValue,
  timeValue,
  timestamp,
  localDate,
  weekBounds,
  weeklyTarget,
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
  // Only the overall minutes are written; the deprecated unitless duration never is.
  assert.deepEqual(
    workoutInput(
      { workout_name: "Renamed", duration_minutes: "30", occurred_at: "" },
      original,
    ),
    { workout_name: "Renamed", duration_minutes: 30 },
  );
  assert.equal(
    workoutInput(
      { workout_name: "Renamed", duration_minutes: " ", occurred_at: "" },
      original,
    ).duration_minutes,
    null,
  );
  assert.equal(
    workoutInput({
      workout_name: "Walk",
      duration_minutes: "12.5",
      occurred_at: "",
    }).duration_minutes,
    12.5,
  );
  const known = { ...original, occurred_at: "2026-09-27T12:00:00Z" };
  assert.equal(
    workoutInput(
      { workout_name: "Lift", duration_minutes: "30", occurred_at: "" },
      known,
    ).occurred_at,
    null,
  );
  assert.equal(
    workoutInput(
      {
        workout_name: "Lift",
        duration_minutes: "30",
        occurred_at: known.occurred_at,
      },
      known,
    ).occurred_at,
    undefined,
  );
  assert.equal(
    workoutInput({
      workout_name: "Lift",
      duration_minutes: "",
      occurred_at: "",
    }).occurred_at,
    null,
  );
});
test("workout items send a weight unit whenever the weight is positive", () => {
  const item = {
    exercise_name: "Bench",
    sets: "3",
    reps: "5",
    weight: "225",
    duration_minutes: "0",
    weight_unit: "lb",
  };
  assert.deepEqual(workoutItemInput(item), {
    exercise_name: "Bench",
    sets: 3,
    reps: 5,
    weight: 225,
    duration_minutes: 0,
    weight_unit: "lb",
  });
  // Older items load with no unit; saving a weight requires choosing one.
  for (const weight_unit of ["", "stone", "KG"])
    assert.throws(
      () => workoutItemInput({ ...item, weight_unit }),
      /Choose kg or lb/,
    );
  const cardio = workoutItemInput({ ...item, weight: "0", weight_unit: "" });
  assert.equal(cardio.weight_unit, null);
  assert.equal(workoutItemInput({ ...item, weight: "0" }).weight_unit, "lb");
});
test("favorites copy only nutrition fields and logging validates the day", () => {
  const items = [
    {
      id: 4,
      meal_id: 9,
      name: "Rice",
      calories: 200,
      protein: 4,
      carbs: 45,
      fat: 1,
    },
  ];
  assert.deepEqual(
    favoriteInput({ name: "Usual", meal_type: "Lunch" }, items),
    {
      name: "Usual",
      meal_type: "Lunch",
      items: [{ name: "Rice", calories: 200, protein: 4, carbs: 45, fat: 1 }],
    },
  );
  // Omitting items on an edit keeps the favorite's stored items.
  assert.deepEqual(favoriteInput({ name: "Renamed", meal_type: "Brunch" }), {
    name: "Renamed",
    meal_type: "Brunch",
  });
  assert.deepEqual(
    favoriteInput({ name: "Empty", meal_type: "Snack" }, []).items,
    [],
  );
  assert.throws(
    () => favoriteInput({ name: " ", meal_type: "Lunch" }),
    /Favorite name/,
  );
  assert.deepEqual(
    logFavoriteInput({ date: "2026-09-29", time: "", meal_type: "Lunch" }),
    { date: "2026-09-29", time: "", meal_type: "Lunch" },
  );
  assert.throws(() =>
    logFavoriteInput({ date: "2026-02-30", time: "", meal_type: "Lunch" }),
  );
  assert.throws(() =>
    logFavoriteInput({ date: "2026-09-29", time: "25:00", meal_type: "Lunch" }),
  );
});
test("weekly workout targets are blank or 1-14 whole workouts", () => {
  assert.equal(weeklyTarget(""), null);
  assert.equal(weeklyTarget("  "), null);
  assert.equal(weeklyTarget("1"), 1);
  assert.equal(weeklyTarget(" 14 "), 14);
  for (const value of ["0", "15", "2.5", "-3", "abc"])
    assert.throws(() => weeklyTarget(value), /1 to 14/);
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
