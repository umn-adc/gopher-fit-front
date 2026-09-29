import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Avatar, Badge, EmptyState, Icon, ui } from "../../components/Design";
import { palette } from "../../constants/Design";
import { useWorkoutHistory } from "../../lib/useFitness";
import {
  Action,
  Feedback,
  Field,
  Screen,
  Section,
  styles,
} from "../../components/Form";
import { ListStatus } from "../../components/ListStatus";
import { Text, View } from "../../components/Themed";
import { api, ApiError } from "../../lib/api";
import type {
  Friendship,
  FriendshipStatus,
  LeaderboardEntry,
  MuscleRank,
  PublicProfile,
} from "../../lib/api-types";
import { useAuth } from "../../lib/auth";
import { usePagedList, useTask } from "../../lib/hooks";
import { name, numberValue } from "../../lib/validation";
const collections = [
  ["accepted", "Friends"],
  ["inpending", "Incoming requests"],
  ["outpending", "Outgoing requests"],
  ["outblocks", "Blocked by you"],
  ["inblocks", "Incoming blocks"],
] as const;
export default function Social() {
  const session = useAuth()!;
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab =
    params.tab === "Rankings" || params.tab === "Friends" ? params.tab : "Feed";
  const [manage, setManage] = useState(false);
  const history = useWorkoutHistory();
  const [userId, setUserId] = useState("");
  const [found, setFound] = useState<PublicProfile | null>(null);
  const [relationship, setRelationship] = useState<Friendship | null>(null);
  const [revision, setRevision] = useState(0);
  const [exercise, setExercise] = useState("");
  const [query, setQuery] = useState("");
  const task = useTask();
  const lookup = useTask();
  const leaderboard = usePagedList<LeaderboardEntry>(
    query ? `/social/leaderboard?exercise=${encodeURIComponent(query)}` : null,
  );
  const ranks = usePagedList<MuscleRank>("/social/muscle-ranks");
  function findUser(idText: string) {
    void lookup.run(async () => {
      const id = numberValue(idText, "User ID");
      if (!id || id === session.user_id)
        throw new Error("Enter another person's positive user ID.");
      const profile = await api.request<PublicProfile>(`/profile/${id}`);
      let relation: Friendship | null;
      try {
        relation = await api.request<Friendship>(`/social/friendships/${id}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) relation = null;
        else throw e;
      }
      setFound(profile);
      setRelationship(relation);
    }, "");
  }
  function change(
    otherId: number,
    status: FriendshipStatus | "delete",
    existing: boolean,
  ) {
    void task.run(async () => {
      try {
        const result = await api.request<Friendship | void>(
          `/social/friendships${existing ? `/${otherId}` : ""}`,
          {
            method: status === "delete" ? "DELETE" : existing ? "PUT" : "POST",
            ...(status === "delete"
              ? {}
              : {
                  body: {
                    user1_id: session.user_id,
                    user2_id: otherId,
                    status,
                  },
                }),
          },
        );
        if (found?.user_id === otherId) setRelationship(result ?? null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          setRevision((r) => r + 1);
          setFound(null);
        }
        throw e;
      }
      setRevision((r) => r + 1);
    }, "Relationship updated.");
  }
  const buttons = (otherId: number, relation: Friendship | null) => (
    <FriendshipActions
      userId={session.user_id}
      otherId={otherId}
      relationship={relation}
      saving={task.saving}
      change={change}
    />
  );
  const showLeaderboard = () => {
    try {
      const value = name(exercise, "Exercise");
      lookup.setError("");
      if (query === value) void leaderboard.reload();
      else setQuery(value);
    } catch (e) {
      lookup.setError((e as Error).message);
    }
  };
  const mine = leaderboard.items.find(
    (entry) => entry.user_id === session.user_id,
  );
  return (
    <Screen title="Social" subtitle="Connect and compete" icon="trophy">
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          padding: 6,
        }}
      >
        {(
          [
            ["Feed", "trending-up"],
            ["Rankings", "trophy"],
            ["Friends", "users"],
          ] as const
        ).map(([title, icon]) => (
          <Pressable
            key={title}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected: tab === title }}
            onPress={() => router.setParams({ tab: title })}
            style={{
              flex: 1,
              minHeight: 42,
              borderRadius: 22,
              backgroundColor: tab === title ? palette.white : "transparent",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name={icon} size={17} color={palette.text} />
            <Text style={{ fontSize: 14, fontWeight: "600" }}>{title}</Text>
          </Pressable>
        ))}
      </View>
      {tab === "Feed" && (
        <>
          <Text style={ui.muted}>
            Your activity · Friends&apos; posts aren&apos;t available yet.
          </Text>
          {history.summary?.recent.map((workout) => (
            <Section key={workout.id} style={{ padding: 20 }}>
              <View style={ui.row}>
                <Avatar name={session.username} />
                <View style={{ flex: 1 }}>
                  <View style={ui.row}>
                    <Text>{session.username}</Text>
                    <Badge>You</Badge>
                  </View>
                  <Text style={ui.muted}>
                    {new Date(workout.occurred_at!).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </Text>
                </View>
              </View>
              <Text style={{ marginVertical: 24 }}>
                Logged a workout. One more step toward your goals. 💪
              </Text>
              <View style={ui.softRow}>
                <Icon name="flame" color={palette.orange} />
                <View style={{ flex: 1 }}>
                  <Text>{workout.workout_name}</Text>
                  <Text style={ui.muted}>
                    {workout.items?.length ?? 0} exercises ·{" "}
                    {(workout.items ?? []).reduce(
                      (n, item) => n + item.duration_minutes,
                      0,
                    )}{" "}
                    min logged
                  </Text>
                </View>
              </View>
              <Action
                title="View workout"
                compact
                secondary
                onPress={() => router.push("/workouts")}
              />
            </Section>
          ))}
          {!history.summary?.recent.length && (
            <Section>
              <EmptyState
                icon="activity"
                title={
                  history.summary
                    ? "Your story starts with a workout"
                    : history.error
                      ? "Activity unavailable"
                      : "Loading your activity…"
                }
                detail="Log a dated workout to see it in your activity feed."
              />
              <Action
                title="Log a workout"
                onPress={() => router.push("/workouts")}
              />
            </Section>
          )}
          <Feedback error={history.error} />
        </>
      )}
      {tab === "Rankings" && (
        <>
          <Section>
            <View style={ui.between}>
              <Text>Your Ranking</Text>
              <Badge filled>{mine ? `# ${mine.rank}` : "—"}</Badge>
            </View>
            <View style={[ui.between, { marginTop: 24 }]}>
              {[
                [mine?.max_weight ?? "—", "Best weight"],
                [mine?.percentile ?? "—", "Percentile"],
                [history.summary?.streak ?? "—", "Day streak"],
              ].map(([value, label]) => (
                <View key={label} style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 24, lineHeight: 32 }}>{value}</Text>
                  <Text style={ui.muted}>{label}</Text>
                </View>
              ))}
            </View>
          </Section>
          <Section title="Exercise leaderboard">
            <Field
              label="Exercise"
              placeholder="Bench press"
              value={exercise}
              onChangeText={setExercise}
              onSubmitEditing={showLeaderboard}
            />
            <Action
              title="Show leaderboard"
              disabled={leaderboard.loading}
              onPress={showLeaderboard}
            />
            <Text style={ui.muted}>
              Compare lifts using the same weight units as your workouts.
            </Text>
            <Feedback {...lookup} />
          </Section>
          <Text>{query ? `Rankings for ${query}` : "University Rankings"}</Text>
          {!query && (
            <Section>
              <EmptyState
                icon="trophy"
                title="Find your place"
                detail="Choose an exercise to compare your personal best with other athletes."
              />
            </Section>
          )}
          {leaderboard.items.map((entry) => (
            <Pressable
              key={entry.user_id}
              accessibilityRole="button"
              accessibilityLabel={`View ${entry.username} (ID ${entry.user_id})`}
              disabled={
                entry.user_id === session.user_id ||
                lookup.saving ||
                task.saving
              }
              onPress={() => {
                setUserId(String(entry.user_id));
                findUser(String(entry.user_id));
                router.setParams({ tab: "Friends" });
              }}
              style={[
                ui.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  gap: 16,
                },
              ]}
            >
              <View style={{ width: 30, alignItems: "center" }}>
                {entry.rank <= 3 ? (
                  <Icon
                    name="award"
                    color={
                      [palette.gold, "#9aa1af", palette.orange][entry.rank - 1]
                    }
                  />
                ) : (
                  <Text>{entry.rank}</Text>
                )}
              </View>
              <Avatar
                name={entry.username}
                muted={entry.user_id !== session.user_id}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight:
                      entry.user_id === session.user_id ? "600" : "400",
                  }}
                >
                  #{entry.rank} {entry.username}
                </Text>
                <Text style={ui.muted}>{entry.percentile}th percentile</Text>
              </View>
              <Text style={{ fontSize: 20 }}>{entry.max_weight}</Text>
            </Pressable>
          ))}
          {query && (
            <ListStatus
              list={leaderboard}
              empty="No ranked lifts for this exercise yet."
            />
          )}
          <Section title="Your exercise ranks">
            {ranks.items.map((rank) => (
              <View key={rank.exercise_key} style={ui.softRow}>
                <Icon name="dumbbell" />
                <Text style={{ flex: 1 }}>
                  {rank.exercise_name} · Weight {rank.max_weight} · Rank{" "}
                  {rank.rank} · {rank.percentile}th percentile
                </Text>
              </View>
            ))}
            <ListStatus
              list={ranks}
              empty="No ranked lifts yet. Log an exercise with a positive weight."
            />
          </Section>
        </>
      )}
      {tab === "Friends" && (
        <>
          <FriendshipSection
            key={`accepted-${revision}`}
            collection="accepted"
            title="Workout Buddies"
            userId={session.user_id}
            buttons={buttons}
            onLookup={(id) => {
              setUserId(String(id));
              findUser(String(id));
            }}
            lookupDisabled={lookup.saving || task.saving}
          />
          <Section title="Find Workout Partners">
            <Text style={[ui.muted, { marginVertical: 8 }]}>
              Connect with athletes who share your goals and sports interests.
            </Text>
            <Text style={ui.muted}>
              Your user ID is {session.user_id}. Ask a friend for their user ID.
            </Text>
            <Field
              label="Friend's user ID"
              placeholder="Enter a user ID"
              value={userId}
              keyboardType="number-pad"
              onChangeText={setUserId}
            />
            <Action
              title={lookup.saving ? "Looking up…" : "Look up user"}
              icon="users"
              disabled={lookup.saving || task.saving}
              onPress={() => findUser(userId)}
            />
            <Feedback {...lookup} />
            {found && (
              <>
                <View style={ui.row}>
                  <Avatar name={found.username} />
                  <Text style={{ flex: 1 }}>
                    {found.username} · User {found.user_id}
                  </Text>
                </View>
                {buttons(found.user_id, relationship)}
              </>
            )}
            <Feedback {...task} />
          </Section>
          <Action
            title={
              manage ? "Hide requests and blocks" : "Manage requests and blocks"
            }
            secondary
            icon="users"
            onPress={() => setManage(!manage)}
          />
          {manage &&
            collections
              .filter(([collection]) => collection !== "accepted")
              .map(([collection, title]) => (
                <FriendshipSection
                  key={`${collection}-${revision}`}
                  collection={collection}
                  title={title}
                  userId={session.user_id}
                  buttons={buttons}
                  onLookup={(id) => {
                    setUserId(String(id));
                    findUser(String(id));
                  }}
                  lookupDisabled={lookup.saving || task.saving}
                />
              ))}
          <Section title="Team Challenges">
            <EmptyState
              icon="target"
              title="Stronger together"
              detail="Team challenges aren't available yet. Add a workout buddy to stay connected."
            />
          </Section>
        </>
      )}
    </Screen>
  );
}
function FriendshipActions({
  userId,
  otherId,
  relationship,
  saving,
  change,
}: {
  userId: number;
  otherId: number;
  relationship: Friendship | null;
  saving: boolean;
  change: (
    id: number,
    status: FriendshipStatus | "delete",
    existing: boolean,
  ) => void;
}) {
  if (
    relationship?.status === "blocked" &&
    relationship.action_user_id !== userId
  )
    return <Text>This user has blocked this relationship.</Text>;
  return (
    <View style={styles.row}>
      {!relationship && (
        <Action
          title="Send request"
          disabled={saving}
          onPress={() => change(otherId, "pending", false)}
        />
      )}
      {relationship?.status === "pending" &&
        relationship.action_user_id !== userId && (
          <Action
            title="Accept request"
            disabled={saving}
            onPress={() => change(otherId, "accepted", true)}
          />
        )}
      {relationship && (
        <Action
          title={
            relationship.status === "blocked"
              ? "Unblock"
              : relationship.status === "accepted"
                ? "Remove friend"
                : relationship.action_user_id === userId
                  ? "Cancel request"
                  : "Decline request"
          }
          secondary
          disabled={saving}
          onPress={() => change(otherId, "delete", true)}
        />
      )}
      {relationship?.status !== "blocked" && (
        <Action
          title="Block user"
          secondary
          disabled={saving}
          onPress={() => change(otherId, "blocked", !!relationship)}
        />
      )}
    </View>
  );
}
function FriendshipSection({
  collection,
  title,
  userId,
  buttons,
  onLookup,
  lookupDisabled,
}: {
  collection: string;
  title: string;
  userId: number;
  buttons: (id: number, relationship: Friendship) => React.ReactNode;
  onLookup: (id: number) => void;
  lookupDisabled: boolean;
}) {
  const list = usePagedList<Friendship>(`/social/friendships/${collection}`);
  return (
    <Section title={title}>
      {list.items.map((relation) => {
        const otherId =
          relation.user1_id === userId ? relation.user2_id : relation.user1_id;
        return (
          <View
            key={`${relation.user1_id}-${relation.user2_id}`}
            style={{
              gap: 12,
              padding: 16,
              borderRadius: 20,
              backgroundColor: palette.warm,
            }}
          >
            <FriendIdentity
              id={otherId}
              onPress={() => onLookup(otherId)}
              disabled={lookupDisabled}
            />
            {buttons(otherId, relation)}
          </View>
        );
      })}
      <ListStatus list={list} empty={`No ${title.toLowerCase()} yet.`} />
    </Section>
  );
}

function FriendIdentity({
  id,
  onPress,
  disabled,
}: {
  id: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    api
      .request<PublicProfile>(`/profile/${id}`, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setProfile(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [id]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`User ${id}`}
      disabled={disabled}
      onPress={onPress}
      style={ui.row}
    >
      <Avatar name={profile?.username ?? "?"} />
      <View style={{ flex: 1 }}>
        <Text>{profile?.username ?? `User ${id}`}</Text>
        <Text style={ui.muted}>View athlete</Text>
      </View>
      <Icon name="chevron-right" size={16} color={palette.muted} />
    </Pressable>
  );
}
