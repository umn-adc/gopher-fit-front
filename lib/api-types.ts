export type AuthResponse = {
  token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  username: string;
  token_type: string;
};
export const genders = ["Male", "Female", "Other"] as const;
export const activities = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
  "Extra Active",
] as const;
export type ProfileInput = {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  activity_level: string;
  goals: string[] | null;
  sports: string[] | null;
};
export type Profile = ProfileInput & { user_id: number };
export type PublicProfile = { user_id: number; username: string };
export type RegisterInput = ProfileInput & {
  username: string;
  password: string;
};
export type MealItemInput = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type MealItem = MealItemInput & { id: number; meal_id: number };
export type MealInput = { date: string; meal_type: string; time: string };
export type Meal = MealInput & {
  id: number;
  user_id: number;
  total_calories: number;
  items?: MealItem[];
};
export type MacroInput = {
  calories_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
};
export type Macros = MacroInput & { user_id: number };
export type WorkoutItemInput = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration_minutes: number;
};
export type WorkoutItem = WorkoutItemInput & { id: number; workout_id: number };
export type WorkoutInput = {
  workout_name: string;
  duration: number;
  occurred_at?: string | null;
};
export type Workout = WorkoutInput & {
  id: number;
  user_id: number;
  items?: WorkoutItem[];
};
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type FriendshipInput = {
  user1_id: number;
  user2_id: number;
  status: FriendshipStatus;
};
export type Friendship = FriendshipInput & { action_user_id: number };
export type LeaderboardEntry = {
  user_id: number;
  username: string;
  max_weight: number;
  rank: number;
  percentile: number;
};
export type MuscleRank = Omit<LeaderboardEntry, "username"> & {
  exercise_key: string;
  exercise_name: string;
  source_workout_item_id: number;
};
