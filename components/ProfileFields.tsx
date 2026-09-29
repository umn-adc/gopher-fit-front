import {
  activities,
  genders,
  isActivityLevel,
  isGender,
  type Profile,
  type ProfileInput,
} from "../lib/api-types";
import { name, numberValue } from "../lib/validation";
import { Choices, Field } from "./Form";
import { Text } from "./Themed";
export type ProfileDraft = {
  name: string;
  age: string;
  height: string;
  weight: string;
  gender: string;
  activity_level: string;
  goals: string;
  sports: string;
  unit_preference: string;
};
const unitLabels = {
  metric: "Metric (kg, cm)",
  imperial: "Imperial (lb, ft/in)",
} as const;
export const emptyProfile: ProfileDraft = {
  name: "",
  age: "0",
  height: "0",
  weight: "0",
  gender: "",
  activity_level: "",
  goals: "",
  sports: "",
  unit_preference: "metric",
};
export function profileDraft(profile: Profile): ProfileDraft {
  return {
    ...profile,
    age: String(profile.age),
    height: String(profile.height),
    weight: String(profile.weight),
    goals: (profile.goals ?? []).join("\n"),
    sports: (profile.sports ?? []).join("\n"),
  };
}
export function profileInput(
  draft: ProfileDraft,
  original?: Profile,
): ProfileInput {
  const { gender, activity_level } = draft;
  if (!isGender(gender) || !isActivityLevel(activity_level))
    throw new Error("Choose a gender and activity level.");
  const list = (key: "goals" | "sports") =>
    original && draft[key] === (original[key] ?? []).join("\n")
      ? original[key]
      : draft[key]
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
  return {
    name: name(draft.name),
    age: numberValue(draft.age, "Age", true, 130),
    height: numberValue(draft.height, "Height", true, 300),
    weight: numberValue(draft.weight, "Weight", true, 700),
    gender,
    activity_level,
    goals: list("goals"),
    sports: list("sports"),
    unit_preference:
      draft.unit_preference === "imperial" ? "imperial" : "metric",
    // Not edited in this form; PUT replaces the whole profile, so keep the saved value.
    weekly_workout_target: original?.weekly_workout_target ?? null,
  };
}
export function ProfileFields({
  value,
  onChange,
}: {
  value: ProfileDraft;
  onChange: (value: ProfileDraft) => void;
}) {
  const set = (key: keyof ProfileDraft, text: string) =>
    onChange({ ...value, [key]: text });
  return (
    <>
      <Field
        label="Name"
        value={value.name}
        onChangeText={(v) => set("name", v)}
        maxLength={200}
      />
      <Text>
        Age, height and weight use whole numbers. Enter 0 if unspecified.
      </Text>
      {(
        [
          ["age", "Age"],
          ["height", "Height (cm)"],
          ["weight", "Weight (kg)"],
        ] as const
      ).map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={value[key]}
          keyboardType="number-pad"
          onChangeText={(v) => set(key, v)}
        />
      ))}
      <Choices
        label="Gender"
        options={genders}
        value={value.gender}
        onChange={(v) => set("gender", v)}
      />
      <Choices
        label="Activity level"
        options={activities}
        value={value.activity_level}
        onChange={(v) => set("activity_level", v)}
      />
      <Choices
        label="Display units"
        options={Object.values(unitLabels)}
        value={
          unitLabels[
            value.unit_preference === "imperial" ? "imperial" : "metric"
          ]
        }
        onChange={(v) =>
          set(
            "unit_preference",
            v === unitLabels.imperial ? "imperial" : "metric",
          )
        }
      />
      <Text>
        New exercises default to this weight unit, and rankings use it. Profile
        height and weight are still entered in cm and kg.
      </Text>
      <Field
        label="Goals (one per line, optional)"
        multiline
        value={value.goals}
        onChangeText={(v) => set("goals", v)}
      />
      <Field
        label="Sports (one per line, optional)"
        multiline
        value={value.sports}
        onChangeText={(v) => set("sports", v)}
      />
    </>
  );
}
