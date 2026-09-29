// Shapes come from the backend OpenAPI document (lib/api-schema.ts, `npm run gen:api`).
import type { components } from "./api-schema";

type Schema<Name extends keyof components["schemas"]> =
  components["schemas"][Name];

export type AuthResponse = Schema<"AuthResponse">;
export type Gender = Schema<"ProfileRequest">["gender"];
export type ActivityLevel = Schema<"ProfileRequest">["activity_level"];
export const genders = [
  "Male",
  "Female",
  "Other",
] as const satisfies readonly Gender[];
export const activities = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
  "Extra Active",
] as const satisfies readonly ActivityLevel[];
export const isGender = (value: string): value is Gender =>
  genders.some((gender) => gender === value);
export const isActivityLevel = (value: string): value is ActivityLevel =>
  activities.some((activity) => activity === value);
// Profile PUT is a full replacement, so every field is always sent.
export type ProfileInput = Required<Schema<"ProfileRequest">>;
// Stored gender/activity are plain strings: rows from the Go era may hold "".
export type Profile = Schema<"ProfileResponse">;
export type PublicProfile = Schema<"PublicProfileResponse">;
export type RegisterInput = ProfileInput &
  Pick<Schema<"RegisterRequest">, "username" | "password">;
export type MealItemInput = Required<Schema<"MealItemRequest">>;
export type MealItem = Schema<"MealItemResponse">;
// Parent edits never send items; dedicated item routes preserve siblings.
export type MealInput = Required<
  Pick<Schema<"MealRequest">, "date" | "meal_type" | "time">
>;
export type Meal = Schema<"MealResponse">;
export type NutritionSummary = Schema<"NutritionSummaryResponse">;
export type MacroInput = Required<Schema<"MacroGoalsRequest">>;
export type Macros = Schema<"MacroGoalsResponse">;
// Every field is sent; weight_unit is required whenever weight is positive.
export type WorkoutItemInput = Required<Schema<"WorkoutItemRequest">>;
export type WorkoutItem = Schema<"WorkoutItemResponse">;
export type WorkoutInput = Omit<Schema<"WorkoutRequest">, "items">;
export type Workout = Schema<"WorkoutResponse">;
// The database CHECK constraint limits status to these values; the schema says string.
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type FriendshipInput = Omit<Schema<"FriendshipRequest">, "status"> & {
  user1_id: number;
  user2_id: number;
  status: FriendshipStatus;
};
export type Friendship = Omit<Schema<"FriendshipResponse">, "status"> & {
  status: FriendshipStatus;
};
export type UserSearchResult = Schema<"UserSearchResponse">;
export type LeaderboardEntry = Schema<"LeaderboardResponse">;
export type MuscleRank = Schema<"MuscleRankResponse">;
