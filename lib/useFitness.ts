import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { allPages, api, errorMessage } from "./api";
import type { Profile, Workout } from "./api-types";
import { workoutSummary } from "./fitness";

export function useWorkoutHistory(revision = 0) {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setWorkouts(null);
      setError("");
      allPages<Workout>(
        (path) => api.request(path, { signal: controller.signal }),
        "/workouts/",
      )
        .then((value) => {
          if (!controller.signal.aborted) setWorkouts(value);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(errorMessage(e));
        });
      return () => controller.abort();
    }, [revision]),
  );
  return {
    workouts,
    summary: workouts ? workoutSummary(workouts) : null,
    error,
  };
}

// Reloaded on focus; the last profile stays visible while a reload is in flight.
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setError("");
      api
        .request<Profile>("/profile/", { signal: controller.signal })
        .then((value) => {
          if (!controller.signal.aborted) setProfile(value);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(errorMessage(e));
        });
      return () => controller.abort();
    }, []),
  );
  return { profile, error };
}
