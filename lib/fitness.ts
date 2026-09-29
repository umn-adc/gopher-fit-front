import type { Meal, Workout } from "./api-types";
import { localDate, weekBounds } from "./validation";

export function nutritionTotals(meals: Meal[], day: string) {
  return meals
    .filter((meal) => meal.date === day)
    .reduce(
      (total, meal) => ({
        calories: total.calories + meal.total_calories,
        protein:
          total.protein +
          (meal.items ?? []).reduce((n, item) => n + item.protein, 0),
        carbs:
          total.carbs +
          (meal.items ?? []).reduce((n, item) => n + item.carbs, 0),
        fat:
          total.fat + (meal.items ?? []).reduce((n, item) => n + item.fat, 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

// The overall duration when recorded, otherwise the exercises' minutes.
export function workoutMinutes(workout: Workout) {
  return (
    workout.duration_minutes ??
    (workout.items ?? []).reduce((n, item) => n + item.duration_minutes, 0)
  );
}

export function workoutSummary(workouts: Workout[], now = new Date()) {
  const week = weekBounds(now);
  const dated = workouts.filter(
    (w) => w.occurred_at && Number.isFinite(Date.parse(w.occurred_at)),
  );
  const weekWorkouts = dated.filter(
    (w) =>
      Date.parse(w.occurred_at!) >= Date.parse(week.start) &&
      Date.parse(w.occurred_at!) < Date.parse(week.end),
  );
  const days = new Set(
    dated
      .map((w) => localDate(new Date(w.occurred_at!)))
      .filter((day) => day <= localDate(now)),
  );
  const cursor = new Date(now);
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const orderedDays = [...days]
    .map((day) => Date.parse(day + "T00:00:00Z") / 86400000)
    .sort((a, b) => a - b);
  let longest = 0,
    run = 0;
  orderedDays.forEach((day, index) => {
    run = index > 0 && day === orderedDays[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const minutes = (rows: Workout[]) =>
    rows.reduce((sum, w) => sum + workoutMinutes(w), 0);
  return {
    total: workouts.length,
    week: weekWorkouts.length,
    minutes: minutes(workouts),
    weekMinutes: minutes(weekWorkouts),
    streak,
    longest,
    today: dated.filter(
      (w) => localDate(new Date(w.occurred_at!)) === localDate(now),
    ),
    recent: [...dated]
      .sort((a, b) => Date.parse(b.occurred_at!) - Date.parse(a.occurred_at!))
      .slice(0, 3),
  };
}

export function inchesToCm(value: string) {
  return convertMeasurement(value, 2.54, 300, "Height");
}
export function poundsToKg(value: string) {
  return convertMeasurement(value, 0.45359237, 700, "Weight");
}
function convertMeasurement(
  value: string,
  factor: number,
  max: number,
  label: string,
) {
  const numeric = Number(value);
  if (
    !value.trim() ||
    !Number.isFinite(numeric) ||
    numeric <= 0 ||
    numeric * factor > max
  )
    throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  return String(Math.round(numeric * factor));
}
