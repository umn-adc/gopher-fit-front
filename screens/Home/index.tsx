import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Text } from "../../components/Themed";
import { Action, Feedback, Screen, Section } from "../../components/Form";
import {
  Badge,
  EmptyState,
  Icon,
  InfoSheet,
  Progress,
  Tile,
  ui,
} from "../../components/Design";
import { StatsBlob } from "../../components/StatsBlob";
import CaloriesBlob from "../../assets/images/caloriesBlob";
import ProteinBlob from "../../assets/images/proteinBlob";
import StreaksBlob from "../../assets/images/streaksBlob";
import WorkoutsBlob from "../../assets/images/workoutsBlob";
import { api, errorMessage } from "../../lib/api";
import type { NutritionSummary, Profile } from "../../lib/api-types";
import { workoutMinutes } from "../../lib/fitness";
import { roundTenth } from "../../lib/units";
import { useWorkoutHistory } from "../../lib/useFitness";
import { localDate } from "../../lib/validation";
import { useAuth } from "../../lib/auth";
import { palette } from "../../constants/Design";

function calorieBadge(calories: number, target: number) {
  if (calories < target) return `${(target - calories).toLocaleString()} left`;
  const over = calories - target;
  return over ? `Goal met! ${over.toLocaleString()} over` : "Goal met!";
}

export default function Home() {
  const session = useAuth()!;
  const router = useRouter();
  const wide = useWindowDimensions().width >= 760;
  // One summary request gives today's totals and targets (null when unset).
  const [totals, setTotals] = useState<NutritionSummary | null>(null);
  const macros = totals?.targets;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [scan, setScan] = useState(false);
  const history = useWorkoutHistory(retry);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setTotals(null);
      setErrors([]);
      setLoading(true);
      const read = <T,>(path: string) =>
        api.request<T>(path, { signal: controller.signal });
      const report = (e: unknown) => {
        if (!controller.signal.aborted)
          setErrors((old) => [...old, errorMessage(e)]);
      };
      void Promise.allSettled([
        read<NutritionSummary>(`/nutrition/summary?date=${localDate()}`)
          .then((value) => {
            if (!controller.signal.aborted) setTotals(value);
          })
          .catch(report),
        read<Profile>("/profile/")
          .then((value) => {
            if (!controller.signal.aborted) setProfile(value);
          })
          .catch(report),
      ]).then(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [retry]),
  );
  const targetNote = (target: number | undefined) =>
    macros === null
      ? "No target configured"
      : macros === undefined
        ? loading
          ? "Loading targets…"
          : "Targets unavailable"
        : target === 0
          ? "Target is zero"
          : undefined;
  const totalNote = (target: number | undefined) =>
    !totals
      ? loading
        ? "Loading today's meals…"
        : "Total unavailable"
      : targetNote(target);
  const weeklyTarget = profile?.weekly_workout_target;
  const displayName = profile?.name || session.username;
  const summary = history.summary;
  return (
    <Screen title="Home" hideHeader>
      <View style={ui.header}>
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={[ui.title, { color: "#080808" }]}
          >
            Hi, {displayName}! 👋
          </Text>
          <Text style={{ marginTop: 4, lineHeight: 22 }}>
            Ready to crush your goals today?
          </Text>
        </View>
      </View>
      <View style={[ui.grid, wide && { flexWrap: "nowrap" }]}>
        <StatsBlob
          numerator={totals?.calories}
          goal={macros?.calories_target}
          unit="kcal"
          stat="Calories"
          Icon={CaloriesBlob}
          note={totalNote(macros?.calories_target)}
        />
        <StatsBlob
          numerator={totals?.protein}
          goal={macros?.protein_target}
          unit="g"
          stat="Protein"
          Icon={ProteinBlob}
          note={totalNote(macros?.protein_target)}
        />
        <StatsBlob
          numerator={summary?.week}
          goal={weeklyTarget}
          unit="this week"
          stat="Workouts"
          Icon={WorkoutsBlob}
          showProgress={weeklyTarget != null}
          note={
            !summary
              ? history.error
                ? "Count unavailable"
                : "Loading workouts…"
              : weeklyTarget != null && summary.week >= weeklyTarget
                ? "Weekly target met"
                : undefined
          }
        />
        <StatsBlob
          numerator={summary?.streak}
          unit="days"
          stat="Streak"
          Icon={StreaksBlob}
          showProgress={false}
        />
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
        <Section style={{ flex: 1 }}>
          <View style={ui.between}>
            <Text>Daily Nutrition</Text>
            {totals && macros && macros.calories_target > 0 && (
              <Badge filled={totals.calories >= macros.calories_target}>
                {calorieBadge(totals.calories, macros.calories_target)}
              </Badge>
            )}
          </View>
          <View style={{ marginTop: 22, gap: 8 }}>
            <View style={ui.between}>
              <Text style={{ fontSize: 14 }}>Calories</Text>
              <Text style={{ fontSize: 14 }}>
                {totals?.calories.toLocaleString() ?? "—"} /{" "}
                {macros?.calories_target.toLocaleString() ?? "—"} kcal
              </Text>
            </View>
            <Progress
              value={totals?.calories}
              goal={macros?.calories_target}
              label="Daily calories"
            />
          </View>
          <View style={[ui.between, { marginTop: 8 }]}>
            {(
              [
                ["Carbs", "carbs", "carbs_target"],
                ["Protein", "protein", "protein_target"],
                ["Fat", "fat", "fat_target"],
              ] as const
            ).map(([label, key, target]) => (
              <View key={key} style={{ flex: 1, alignItems: "center" }}>
                <Text style={ui.muted}>{label}</Text>
                <Text style={{ fontSize: 20 }}>{totals?.[key] ?? "—"}g</Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>
                  / {macros?.[target] ?? "—"}g
                </Text>
              </View>
            ))}
          </View>
          <Action
            title="Log a meal or set your targets"
            compact
            secondary
            onPress={() => router.push("/nutrition")}
          />
        </Section>
        <Section style={{ flex: 1 }}>
          <View style={ui.between}>
            <Text>Today&apos;s Workout</Text>
            {profile?.sports?.[0] && <Badge filled>{profile.sports[0]}</Badge>}
          </View>
          {summary?.today.length ? (
            summary.today.map((workout) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${workout.workout_name}`}
                key={workout.id}
                onPress={() => router.push("/workouts")}
                style={ui.softRow}
              >
                <View
                  style={{
                    backgroundColor: palette.maroonSoft,
                    padding: 10,
                    borderRadius: 30,
                  }}
                >
                  <Icon name="dumbbell" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text>{workout.workout_name}</Text>
                  <Text style={ui.muted}>
                    {(workout.items ?? []).length} exercises ·{" "}
                    {roundTenth(workoutMinutes(workout))} min logged
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <EmptyState
              icon="dumbbell"
              title={
                summary ? "A fresh start for today" : "Loading your workouts…"
              }
              detail={
                summary ? "Your logged workouts will appear here." : undefined
              }
            />
          )}
          <Action
            title="Log a workout"
            compact
            secondary
            onPress={() => router.push("/workouts")}
          />
        </Section>
      </View>
      <Section>
        <View style={ui.row}>
          <Icon name="target" size={20} />
          <Text>Goals Progress</Text>
        </View>
        {profile?.goals?.length ? (
          profile.goals.map((goal) => (
            <Pressable
              key={goal}
              accessibilityRole="button"
              accessibilityLabel={`View goal: ${goal}`}
              onPress={() => router.push("/profile")}
              style={[ui.between, { paddingVertical: 8 }]}
            >
              <Text style={{ flex: 1 }}>{goal}</Text>
              <Icon name="chevron-right" color={palette.muted} size={18} />
            </Pressable>
          ))
        ) : (
          <Text style={ui.muted}>
            Set your fitness goals in your profile to keep them in focus.
          </Text>
        )}
        <Action
          title="Manage goals"
          compact
          secondary
          onPress={() =>
            router.push({ pathname: "/profile", params: { edit: "true" } })
          }
        />
      </Section>
      <View style={[ui.grid, wide && { flexWrap: "nowrap" }]}>
        <Tile
          style={wide ? { flex: 1 } : ui.half}
          title="Scan at RecWell"
          detail="Body composition check"
          icon="calendar"
          onPress={() => setScan(true)}
        />
        <Tile
          style={wide ? { flex: 1 } : ui.half}
          title="Find Workout Buddy"
          detail="Match with athletes"
          icon="users"
          gold
          onPress={() =>
            router.push({ pathname: "/social", params: { tab: "Friends" } })
          }
        />
        <Tile
          style={wide ? { flex: 1 } : ui.half}
          title="Leaderboard"
          detail="See your ranking"
          icon="trophy"
          onPress={() =>
            router.push({ pathname: "/social", params: { tab: "Rankings" } })
          }
        />
        <Tile
          style={wide ? { flex: 1 } : ui.half}
          title="Achievements"
          detail="View your badges"
          icon="award"
          gold
          onPress={() =>
            router.push({
              pathname: "/profile",
              params: { achievements: "true" },
            })
          }
        />
      </View>
      {errors.map((error, index) => (
        <Feedback key={index} error={error} />
      ))}
      <Feedback error={history.error} />
      <Action
        title={loading ? "Refreshing…" : "Refresh stats"}
        icon="refresh-cw"
        secondary
        disabled={loading}
        onPress={() => setRetry((r) => r + 1)}
      />
      {scan && (
        <InfoSheet title="RecWell Body Scans" onClose={() => setScan(false)}>
          <Text>
            Body scan booking isn&apos;t available in GopherFit yet. Contact
            University Recreation & Wellness to arrange a body composition
            check.
          </Text>
          <Action title="Got it" onPress={() => setScan(false)} />
        </InfoSheet>
      )}
    </Screen>
  );
}
