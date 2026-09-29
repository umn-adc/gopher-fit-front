import type { MealInput, Workout, WorkoutInput } from "./api-types";
import {
  dateValue,
  name,
  numberValue,
  timeValue,
  timestamp,
} from "./validation";

// Parent editors deliberately omit items. Dedicated item routes preserve siblings.
export function mealInput(draft: MealInput): MealInput {
  return {
    date: dateValue(draft.date),
    meal_type: name(draft.meal_type, "Meal type"),
    time: timeValue(draft.time),
  };
}
export function workoutInput(
  draft: { workout_name: string; duration: string; occurred_at: string },
  original?: Workout,
): WorkoutInput {
  const body: WorkoutInput = {
    workout_name: name(draft.workout_name, "Workout name"),
    duration: numberValue(draft.duration, "Duration"),
  };
  if (!original || draft.occurred_at !== (original.occurred_at ?? ""))
    body.occurred_at = draft.occurred_at ? timestamp(draft.occurred_at) : null;
  return body;
}
