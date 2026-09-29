import { useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import {
  Badge,
  EmptyState,
  GradientIcon,
  Icon,
  ui,
} from "../../components/Design";
import { palette } from "../../constants/Design";
import { useProfile, useWorkoutHistory } from "../../lib/useFitness";
import {
  Action,
  Choices,
  Feedback,
  Field,
  Screen,
  Section,
  styles,
} from "../../components/Form";
import { ListStatus } from "../../components/ListStatus";
import { Text, View } from "../../components/Themed";
import { api } from "../../lib/api";
import type { Workout, WorkoutItem } from "../../lib/api-types";
import { usePagedList, useTask } from "../../lib/hooks";
import {
  formatWeight,
  preferredWeightUnit,
  roundTenth,
  type UnitPreference,
  weightUnits,
} from "../../lib/units";
import { workoutInput, workoutItemInput } from "../../lib/writes";
const blankWorkout = {
  workout_name: "",
  duration_minutes: "",
  occurred_at: "",
};
function durationLabel(workout: Workout) {
  if (workout.duration_minutes != null)
    return `${roundTenth(workout.duration_minutes)} min`;
  // Deprecated field with no defined unit, from before duration_minutes existed.
  return workout.duration
    ? `${workout.duration} (older entry, unit unknown)`
    : "Duration unknown";
}
export default function Workouts() {
  const scrollRef = useRef<ScrollView>(null);
  const list = usePagedList<Workout>("/workouts/");
  const [editing, setEditing] = useState<Workout | "new" | null>(null);
  const [draft, setDraft] = useState(blankWorkout);
  const task = useTask();
  const [revision, setRevision] = useState(0);
  const history = useWorkoutHistory(revision);
  const { profile } = useProfile();
  const refresh = async () => {
    await list.reload();
    setRevision((r) => r + 1);
  };
  function edit(workout: Workout | "new") {
    setEditing(workout);
    setDraft(
      workout === "new"
        ? blankWorkout
        : {
            workout_name: workout.workout_name,
            duration_minutes:
              workout.duration_minutes == null
                ? ""
                : String(workout.duration_minutes),
            occurred_at: workout.occurred_at ?? "",
          },
    );
    task.setError("");
    task.setMessage("");
  }
  return (
    <Screen
      scrollRef={scrollRef}
      title="Workouts"
      subtitle="Track your training"
      icon="dumbbell"
      colors={[palette.purple, palette.maroon]}
    >
      <Section>
        <View style={ui.between}>
          <Text>This Week</Text>
          <Badge>{history.summary?.week ?? "—"} workouts</Badge>
        </View>
        <Text style={ui.muted}>Every session is a step toward your goals.</Text>
        <View style={[ui.row, { marginTop: 12 }]}>
          {(
            [
              [
                "dumbbell",
                history.summary?.week,
                "Workouts",
                "#f3eaff",
                palette.purple,
              ],
              [
                "clock",
                history.summary?.weekMinutes,
                "Minutes",
                "#e7f0ff",
                palette.blue,
              ],
              [
                "zap",
                history.summary?.streak,
                "Day streak",
                "#fff0e5",
                palette.orange,
              ],
            ] as const
          ).map(([icon, value, label, backgroundColor, color]) => (
            <View
              key={label}
              style={{
                flex: 1,
                backgroundColor,
                borderRadius: 16,
                alignItems: "center",
                gap: 4,
                paddingVertical: 18,
              }}
            >
              <Icon name={icon} color={color} size={22} />
              <Text style={{ fontSize: 22, marginTop: 6 }}>{value ?? "—"}</Text>
              <Text style={{ fontSize: 12, color: palette.muted }}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <Feedback error={history.error} />
      </Section>
      <View style={ui.between}>
        <Text>Your Workouts</Text>
        <View style={styles.row}>
          <Action
            title="Add workout"
            compact
            icon="plus"
            disabled={task.saving}
            onPress={() => edit("new")}
          />
        </View>
      </View>
      <Feedback {...task} />
      {editing && (
        <Section
          title={editing === "new" ? "New workout" : "Edit workout"}
          onLayout={({ nativeEvent }) =>
            scrollRef.current?.scrollTo({
              y: nativeEvent.layout.y,
              animated: true,
            })
          }
        >
          <Field
            label="Workout name"
            value={draft.workout_name}
            onChangeText={(workout_name) =>
              setDraft({ ...draft, workout_name })
            }
          />
          <Field
            label="Workout duration in minutes (blank if unknown)"
            keyboardType="decimal-pad"
            value={draft.duration_minutes}
            onChangeText={(duration_minutes) =>
              setDraft({ ...draft, duration_minutes })
            }
          />
          {editing !== "new" &&
            editing.duration_minutes == null &&
            editing.duration > 0 && (
              <Text style={ui.muted}>
                Older entry: duration {editing.duration}, unit unknown. It stays
                saved; enter minutes above to record the length.
              </Text>
            )}
          <Field
            label="When (timestamp with timezone, or blank for unknown)"
            placeholder="2026-09-25T08:30:00-05:00"
            value={draft.occurred_at}
            onChangeText={(occurred_at) => setDraft({ ...draft, occurred_at })}
          />
          <View style={styles.row}>
            <Action
              title="Use current time"
              secondary
              onPress={() =>
                setDraft({ ...draft, occurred_at: new Date().toISOString() })
              }
            />
            <Action
              title="Clear date"
              secondary
              onPress={() => setDraft({ ...draft, occurred_at: "" })}
            />
          </View>
          <Action
            title={task.saving ? "Saving workout…" : "Save workout"}
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                await api.request<Workout>(
                  editing === "new" ? "/workouts/" : `/workouts/${editing.id}`,
                  {
                    method: editing === "new" ? "POST" : "PUT",
                    body: workoutInput(
                      draft,
                      editing === "new" ? undefined : editing,
                    ),
                  },
                );
                setEditing(null);
                setDraft(blankWorkout);
                await refresh();
              })
            }
          />
          <Action
            title="Cancel workout edit"
            secondary
            disabled={task.saving}
            onPress={() => setEditing(null)}
          />
        </Section>
      )}
      {list.items.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          preference={profile?.unit_preference}
          onEdit={() => edit(workout)}
          refresh={refresh}
        />
      ))}
      <ListStatus
        list={list}
        empty="No workouts yet. Add a workout, then log its exercises."
      />
      <Section title="Quick Start">
        <View style={ui.grid}>
          {[
            ["💪", "Upper Body"],
            ["🦵", "Lower Body"],
            ["🏃", "Cardio"],
            ["🔥", "Core"],
          ].map(([emoji, title]) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              accessibilityLabel={`Quick start ${title}`}
              onPress={() => {
                edit("new");
                setDraft({
                  ...blankWorkout,
                  workout_name: title,
                  occurred_at: new Date().toISOString(),
                });
              }}
              style={[
                ui.half,
                {
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 16,
                  padding: 16,
                  gap: 12,
                },
              ]}
            >
              <Text style={{ fontSize: 26 }}>{emoji}</Text>
              <Text>{title}</Text>
              <Text style={ui.muted}>Build your session</Text>
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="Recent Activity">
        {history.summary?.recent.map((workout) => (
          <Pressable
            accessibilityRole="button"
            key={workout.id}
            onPress={() => edit(workout)}
            style={ui.softRow}
          >
            <View style={{ flex: 1 }}>
              <Text>{workout.workout_name}</Text>
              <Text style={ui.muted}>
                {new Date(workout.occurred_at!).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Icon name="chevron-right" color={palette.muted} size={18} />
          </Pressable>
        ))}
        {history.summary && !history.summary.recent.length && (
          <EmptyState
            icon="clock"
            title="Your next session starts here"
            detail="Add a date to your workouts to see your recent activity."
          />
        )}
      </Section>
      <Section title="Team Training Plan">
        <EmptyState
          icon="target"
          title="Train toward something together"
          detail="Coach-assigned training plans aren't available yet. You can build your own workouts above."
        />
      </Section>
      <Action
        title="Refresh workouts"
        secondary
        icon="refresh-cw"
        disabled={list.loading || task.saving}
        onPress={() => void refresh()}
      />
    </Screen>
  );
}
const blankItem = {
  exercise_name: "",
  sets: "0",
  reps: "0",
  weight: "0",
  duration_minutes: "0",
  weight_unit: "",
};
const itemLabels = {
  exercise_name: "Exercise name",
  sets: "Sets",
  reps: "Reps",
  weight: "Weight",
  duration_minutes: "Exercise duration (minutes)",
};
function WorkoutCard({
  workout,
  preference,
  onEdit,
  refresh,
}: {
  workout: Workout;
  preference?: UnitPreference;
  onEdit: () => void;
  refresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<WorkoutItem | "new" | null>(null);
  const [draft, setDraft] = useState(blankItem);
  const [deleting, setDeleting] = useState(false);
  const task = useTask();
  const path = `/workouts/${workout.id}`;
  function edit(item: WorkoutItem | "new") {
    setEditing(item);
    setDraft(
      item === "new"
        ? { ...blankItem, weight_unit: preferredWeightUnit(preference) }
        : {
            exercise_name: item.exercise_name,
            sets: String(item.sets),
            reps: String(item.reps),
            weight: String(item.weight),
            duration_minutes: String(item.duration_minutes),
            // Older items have no unit; the user must choose rather than guess.
            weight_unit: item.weight_unit ?? "",
          },
    );
  }
  return (
    <Section style={{ padding: 0, overflow: "hidden" }}>
      <View
        style={{
          padding: 20,
          backgroundColor: palette.maroonSoft,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <GradientIcon
          name="dumbbell"
          size={44}
          colors={["#dcb8c1", palette.maroon]}
        />
        <View style={{ flex: 1 }}>
          <Text>{workout.workout_name}</Text>
          <Text style={ui.muted}>{workout.items?.length ?? 0} exercises</Text>
        </View>
        <Action
          title="Edit workout"
          compact
          onPress={onEdit}
          disabled={task.saving}
        />
      </View>
      <View style={{ padding: 20, paddingTop: 4, gap: 16 }}>
        <Text style={ui.muted}>
          {workout.occurred_at
            ? new Date(workout.occurred_at).toLocaleString()
            : "Date unknown"}{" "}
          · Duration: {durationLabel(workout)}
        </Text>
        <View style={styles.row}>
          <Action
            title="Add exercise"
            secondary
            disabled={task.saving}
            onPress={() => edit("new")}
          />
          <Action
            title="Delete workout"
            secondary
            disabled={task.saving}
            onPress={() => setDeleting(true)}
          />
        </View>
        {deleting && (
          <>
            <Text>Delete this workout and all its exercises?</Text>
            <Action
              title="Confirm workout deletion"
              disabled={task.saving}
              onPress={() =>
                void task.run(async () => {
                  await api.request<void>(path, { method: "DELETE" });
                  await refresh();
                })
              }
            />
            <Action
              title="Keep workout"
              secondary
              onPress={() => setDeleting(false)}
            />
          </>
        )}
        <Feedback {...task} />
        {(workout.items ?? []).map((item, index) => (
          <View
            key={item.id}
            style={{
              gap: 12,
              backgroundColor: palette.warm,
              borderRadius: 20,
              padding: 14,
            }}
          >
            <View style={ui.row}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#eeedeb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14 }}>{index + 1}</Text>
              </View>
              <Text style={{ flex: 1 }}>{item.exercise_name}</Text>
            </View>
            <Text style={ui.muted}>
              {item.exercise_name} · {item.sets} sets × {item.reps} reps ·
              Weight {formatWeight(item.weight, item.weight_unit)} ·{" "}
              {item.duration_minutes} min
            </Text>
            <View style={styles.row}>
              <Action
                title={`Edit ${item.exercise_name}`}
                secondary
                disabled={task.saving}
                onPress={() => edit(item)}
              />
              <Action
                title={`Delete ${item.exercise_name}`}
                secondary
                disabled={task.saving}
                onPress={() =>
                  void task.run(async () => {
                    await api.request<void>(`${path}/items/${item.id}`, {
                      method: "DELETE",
                    });
                    await refresh();
                  })
                }
              />
            </View>
          </View>
        ))}
        {!workout.items?.length && <Text>No exercises yet.</Text>}
        {editing && (
          <Section
            title={
              editing === "new" ? "Add exercise item" : "Edit exercise item"
            }
          >
            {(Object.keys(itemLabels) as (keyof typeof itemLabels)[]).map(
              (key) => (
                <Field
                  key={key}
                  label={itemLabels[key]}
                  keyboardType={
                    key === "exercise_name" ? "default" : "decimal-pad"
                  }
                  value={draft[key]}
                  onChangeText={(value) => setDraft({ ...draft, [key]: value })}
                />
              ),
            )}
            <Choices
              label="Weight unit"
              options={weightUnits}
              value={draft.weight_unit}
              onChange={(weight_unit) => setDraft({ ...draft, weight_unit })}
            />
            {!draft.weight_unit && (
              <Text style={ui.muted}>
                This older entry has no weight unit. Choose the unit it was
                logged in before saving a weight.
              </Text>
            )}
            <Action
              title={task.saving ? "Saving exercise…" : "Save exercise"}
              disabled={task.saving}
              onPress={() =>
                void task.run(async () => {
                  const body = workoutItemInput(draft);
                  await api.request<WorkoutItem | void>(
                    `${path}/items${editing === "new" ? "" : `/${editing.id}`}`,
                    { method: editing === "new" ? "POST" : "PUT", body },
                  );
                  setEditing(null);
                  await refresh();
                })
              }
            />
            <Action
              title="Cancel exercise edit"
              secondary
              disabled={task.saving}
              onPress={() => setEditing(null)}
            />
          </Section>
        )}
      </View>
    </Section>
  );
}
