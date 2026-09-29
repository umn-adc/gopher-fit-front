import type { Meal } from "./api-types";
export function dailyTotals(meals: Meal[], day: string) {
  const today = meals.filter((meal) => meal.date === day);
  return {
    calories: today.reduce((sum, meal) => sum + meal.total_calories, 0),
    protein: today.reduce(
      (sum, meal) =>
        sum + (meal.items ?? []).reduce((p, item) => p + item.protein, 0),
      0,
    ),
  };
}
export function progressWidth(
  value: number | undefined,
  goal: number | null | undefined,
) {
  if (value === undefined || goal == null || goal <= 0) return 0;
  return Math.max(0, Math.min(150, (value / goal) * 150));
}
