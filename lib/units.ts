import type { Profile, WorkoutItem } from "./api-types";

export type UnitPreference = Profile["unit_preference"];
export type WeightUnit = NonNullable<WorkoutItem["weight_unit"]>;
export const weightUnits: readonly WeightUnit[] = ["kg", "lb"];
export const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export const isWeightUnit = (value: string): value is WeightUnit =>
  weightUnits.some((unit) => unit === value);

// New workout items default to the unit the user reads weights in.
export function preferredWeightUnit(preference?: UnitPreference): WeightUnit {
  return preference === "imperial" ? "lb" : "kg";
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit) {
  if (from === to) return value;
  return from === "kg" ? value / KG_PER_LB : value * KG_PER_LB;
}

// One decimal place is enough to tell lifts apart and hides float noise.
export function roundTenth(value: number) {
  return Math.round(value * 10) / 10;
}

// A weight as it was logged; historical items can have an unknown unit.
export function formatWeight(value: number, unit: WeightUnit | null) {
  return unit
    ? `${roundTenth(value)} ${unit}`
    : `${roundTenth(value)} (unit unknown)`;
}

// Records and rankings are kilograms; show them in the user's preferred unit.
export function formatKilograms(kg: number, preference?: UnitPreference) {
  const unit = preferredWeightUnit(preference);
  return formatWeight(convertWeight(kg, "kg", unit), unit);
}

// Profiles store whole centimetres and kilograms; zero means unspecified.
export function formatHeight(cm: number, preference?: UnitPreference) {
  if (!cm) return "—";
  if (preference !== "imperial") return `${cm} cm`;
  const inches = Math.round(cm / CM_PER_INCH);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
}

export function formatBodyWeight(kg: number, preference?: UnitPreference) {
  if (!kg) return "—";
  return preference === "imperial"
    ? `${Math.round(kg / KG_PER_LB)} lb`
    : `${kg} kg`;
}
