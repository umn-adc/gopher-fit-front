import type {
  MealInput,
  Workout,
  WorkoutInput,
  WorkoutItemInput,
} from "./api-types";
import { isWeightUnit } from "./units";
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
// Writes only duration_minutes. The backend keeps the deprecated unitless
// `duration` when it is omitted, so old values survive edits.
export function workoutInput(
  draft: {
    workout_name: string;
    duration_minutes: string;
    occurred_at: string;
  },
  original?: Workout,
): WorkoutInput {
  const body: WorkoutInput = {
    workout_name: name(draft.workout_name, "Workout name"),
    duration_minutes: draft.duration_minutes.trim()
      ? numberValue(draft.duration_minutes, "Workout duration", false)
      : null,
  };
  if (!original || draft.occurred_at !== (original.occurred_at ?? ""))
    body.occurred_at = draft.occurred_at ? timestamp(draft.occurred_at) : null;
  return body;
}
export function workoutItemInput(draft: {
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  duration_minutes: string;
  weight_unit: string;
}): WorkoutItemInput {
  const weight = numberValue(draft.weight, "Weight", false);
  const weight_unit = isWeightUnit(draft.weight_unit)
    ? draft.weight_unit
    : null;
  if (weight > 0 && !weight_unit)
    throw new Error("Choose kg or lb for the weight.");
  return {
    exercise_name: name(draft.exercise_name, "Exercise name"),
    sets: numberValue(draft.sets, "Sets"),
    reps: numberValue(draft.reps, "Reps"),
    weight,
    duration_minutes: numberValue(
      draft.duration_minutes,
      "Exercise duration",
      false,
    ),
    weight_unit,
  };
}
