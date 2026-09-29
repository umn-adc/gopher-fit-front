import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { Achievements } from "../../components/Achievements";
import { Gopher } from "../../components/Gopher";
import {
  Badge,
  EmptyState,
  Gradient,
  Icon,
  InfoSheet,
  ui,
} from "../../components/Design";
import { palette } from "../../constants/Design";
import { useWorkoutHistory } from "../../lib/useFitness";
import {
  Action,
  Feedback,
  Field,
  Loading,
  Screen,
  Section,
} from "../../components/Form";
import {
  ProfileFields,
  ProfileDraft,
  profileDraft,
  profileInput,
} from "../../components/ProfileFields";
import { Text } from "../../components/Themed";
import { api, errorMessage } from "../../lib/api";
import { Profile as ProfileData } from "../../lib/api-types";
import { formatBodyWeight, formatHeight } from "../../lib/units";
import { useAuth } from "../../lib/auth";
import { useTask } from "../../lib/hooks";
import { name, password, passwordHelp } from "../../lib/validation";
export default function Profile() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const session = useAuth()!;
  const params = useLocalSearchParams<{
    edit?: string;
    achievements?: string;
  }>();
  const [editingProfile, setEditingProfile] = useState(params.edit === "true");
  const [accountOpen, setAccountOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [info, setInfo] = useState<"achievements" | "scan" | null>(null);
  const history = useWorkoutHistory();
  useEffect(() => {
    if (params.edit === "true") {
      setEditingProfile(true);
      scrollRef.current?.scrollTo({ y: 350, animated: true });
      router.setParams({ edit: undefined });
    }
  }, [params.edit, router]);
  useEffect(() => {
    if (params.achievements === "true") {
      setInfo("achievements");
      router.setParams({ achievements: undefined });
    }
  }, [params.achievements, router]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [username, setUsername] = useState(session.username);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const task = useTask();
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      setLoadError("");
      api
        .request<ProfileData>("/profile/", { signal: controller.signal })
        .then((value) => {
          if (!controller.signal.aborted) {
            setProfile(value);
            setDraft(profileDraft(value));
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted) setLoadError(errorMessage(e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [retry]),
  );
  return (
    <Screen title="Profile" hideHeader scrollRef={scrollRef}>
      <View style={[ui.card, { padding: 0, overflow: "hidden", gap: 0 }]}>
        <View style={{ height: 128 }}>
          <Gradient diagonal />
        </View>
        <View style={{ padding: 24, paddingTop: 0 }}>
          <View
            style={[
              ui.row,
              { alignItems: "flex-end", marginTop: -10, marginBottom: 16 },
            ]}
          >
            <Gopher size={156} />
            <View
              style={{
                flex: 1,
                gap: 10,
                alignItems: "center",
                paddingBottom: 8,
              }}
            >
              <Text
                accessibilityRole="header"
                style={{ fontSize: 24, lineHeight: 30 }}
              >
                {profile?.name || session.username}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {profile?.sports?.map((sport) => (
                  <Badge key={sport}>{sport}</Badge>
                ))}
              </View>
              <Action
                title="Edit profile"
                icon="settings"
                compact
                secondary
                onPress={() => setEditingProfile(!editingProfile)}
              />
            </View>
          </View>
          <View
            style={[
              ui.between,
              {
                borderTopWidth: 1,
                borderTopColor: palette.border,
                paddingTop: 16,
              },
            ]}
          >
            {[
              [profile?.age || "—", "Age"],
              [
                profile
                  ? formatHeight(profile.height, profile.unit_preference)
                  : "—",
                "Height",
              ],
              [
                profile
                  ? formatBodyWeight(profile.weight, profile.unit_preference)
                  : "—",
                "Weight",
              ],
              [history.summary?.streak ?? "—", "Day Streak"],
            ].map(([value, label]) => (
              <View key={label} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 20 }}>{value}</Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Feedback {...task} />
      {editingProfile && (
        <Section title="Your profile">
          <Text>
            {session.username} · Your user ID: {session.user_id}
          </Text>
          {loading && <Loading />}
          <Feedback error={loadError} />
          {loadError && (
            <Action
              title="Retry profile"
              onPress={() => setRetry((r) => r + 1)}
              secondary
            />
          )}
          {draft && profile && (
            <>
              <ProfileFields value={draft} onChange={setDraft} />
              <Action
                title={task.saving ? "Saving…" : "Save profile"}
                disabled={task.saving || loading}
                onPress={() =>
                  void task.run(async () => {
                    const saved = await api.request<ProfileData>("/profile/", {
                      method: "PUT",
                      body: profileInput(draft, profile),
                    });
                    setProfile(saved);
                    setDraft(profileDraft(saved));
                    setEditingProfile(false);
                  })
                }
              />
            </>
          )}
          <Action
            title="Cancel profile edit"
            secondary
            disabled={task.saving}
            onPress={() => {
              if (profile) setDraft(profileDraft(profile));
              setEditingProfile(false);
            }}
          />
        </Section>
      )}
      {!editingProfile && loading && <Loading />}
      {!editingProfile && loadError && (
        <>
          <Feedback error={loadError} />
          <Action
            title="Retry profile"
            secondary
            onPress={() => setRetry((r) => r + 1)}
          />
        </>
      )}
      <View style={ui.grid}>
        {(
          [
            [
              "trophy",
              history.summary?.total ?? "—",
              "Total Workouts",
              "#f3eaff",
              palette.purple,
            ],
            [
              "calendar",
              history.summary
                ? Math.round((history.summary.minutes / 60) * 10) / 10
                : "—",
              "Hours Trained",
              "#e7f0ff",
              palette.blue,
            ],
            ["flame", "—", "Calories Burned", "#fff0e5", palette.orange],
            [
              "award",
              history.summary?.longest ?? "—",
              "Best Day Streak",
              "#fff7df",
              "#e5a600",
            ],
          ] as const
        ).map(([icon, value, label, backgroundColor, color]) => (
          <View
            key={label}
            style={[ui.card, ui.half, { minHeight: 202, padding: 20, gap: 0 }]}
          >
            <View
              style={{
                backgroundColor,
                borderRadius: 16,
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={icon} color={color} />
            </View>
            <Text style={{ fontSize: 24, marginTop: 30, marginBottom: 28 }}>
              {value}
            </Text>
            <Text style={ui.muted}>{label}</Text>
          </View>
        ))}
      </View>
      <Feedback error={history.error} />
      <Section title="Your Goals">
        {profile?.goals?.length ? (
          profile.goals.map((goal) => (
            <Pressable
              accessibilityRole="button"
              key={goal}
              onPress={() => {
                setEditingProfile(true);
                scrollRef.current?.scrollTo({ y: 350, animated: true });
              }}
              style={ui.softRow}
            >
              <Icon name="trending-up" size={18} />
              <Text style={{ flex: 1 }}>{goal}</Text>
              <Icon name="chevron-right" size={16} color={palette.muted} />
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon="target"
            title="Make it personal"
            detail="Add a fitness goal to your profile."
          />
        )}
      </Section>
      <Section>
        <View style={ui.row}>
          <Icon name="award" size={20} />
          <Text>Achievements</Text>
        </View>
        <Achievements summary={history.summary} />
        <Action
          title="View All Achievements"
          compact
          secondary
          onPress={() => setInfo("achievements")}
        />
      </Section>
      <Section>
        <View style={ui.row}>
          <Icon name="bell" size={20} />
          <Text>Notifications</Text>
        </View>
        <Text style={ui.muted}>Notifications aren&apos;t available yet.</Text>
        {[
          "Workout Reminders",
          "Nutrition Alerts",
          "Social Updates",
          "Team Messages",
        ].map((label) => (
          <View key={label} style={ui.softRow}>
            <Text style={{ flex: 1, fontSize: 14 }}>{label}</Text>
            <Switch
              accessibilityLabel={label}
              disabled
              value={false}
              trackColor={{ false: "#dedee2" }}
            />
          </View>
        ))}
      </Section>
      <Section>
        <View style={ui.row}>
          <Icon name="shield" size={20} />
          <Text>Privacy</Text>
        </View>
        <Text style={ui.muted}>
          Your username and exercise rankings are visible to other athletes.
          Visibility controls aren&apos;t available yet.
        </Text>
        <Link
          href={{ pathname: "/social", params: { tab: "Friends" } }}
          style={{ color: palette.maroon }}
        >
          Manage friends and blocks
        </Link>
      </Section>
      <Section>
        <View style={ui.row}>
          <Icon name="trending-up" size={20} />
          <Text>RecWell Body Scans</Text>
        </View>
        <View style={ui.softRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text>No scans connected</Text>
            <Text style={ui.muted}>
              Your body composition journey starts with a scan.
            </Text>
          </View>
        </View>
        <Action title="Schedule Body Scan" onPress={() => setInfo("scan")} />
      </Section>
      <Section>
        <Action
          title="Account Settings"
          icon="user"
          secondary
          compact
          onPress={() => setAccountOpen(!accountOpen)}
        />
        <Action
          title="Privacy & Security"
          icon="shield"
          secondary
          compact
          onPress={() => setSecurityOpen(!securityOpen)}
        />
        <Action
          title={task.saving ? "Please wait…" : "Log out"}
          secondary
          danger
          compact
          disabled={task.saving}
          onPress={() => void task.run(() => api.logout())}
        />
      </Section>
      {accountOpen && (
        <Section title="Username">
          <Field label="Username" value={username} onChangeText={setUsername} />
          <Action
            title="Change username"
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                const saved = await api.request<{ username: string }>(
                  "/profile/username",
                  {
                    method: "PUT",
                    body: { username: name(username, "Username") },
                  },
                );
                api.updateUsername(saved.username);
                setUsername(saved.username);
              })
            }
          />
        </Section>
      )}
      {securityOpen && (
        <Section title="Password">
          <Field
            label="Current password"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Text>{passwordHelp}</Text>
          <Text>Changing your password logs out every session.</Text>
          <Action
            title="Change password"
            disabled={task.saving}
            onPress={() =>
              void task.run(async () => {
                await api.request<{ message: string }>("/profile/password", {
                  method: "PUT",
                  body: {
                    old_password: password(oldPassword),
                    new_password: password(newPassword, true),
                  },
                });
                api.clearSession(
                  "Password changed. Please log in with your new password.",
                );
              })
            }
          />
        </Section>
      )}
      {(accountOpen || securityOpen) && (
        <Section title="Account">
          <Link href="/recovery">Set up recovery or reset your password</Link>
          <Action
            title="Log out all sessions"
            secondary
            disabled={task.saving}
            onPress={() => void task.run(() => api.logout(true))}
          />
          {task.error && (
            <Action
              title="Clear this device's login"
              secondary
              disabled={task.saving}
              onPress={() =>
                api.clearSession(
                  "Local login cleared. Server sessions may still be active.",
                )
              }
            />
          )}
          <Action
            title="Delete account…"
            secondary
            danger
            disabled={task.saving}
            onPress={() => setConfirmDelete(true)}
          />
          {confirmDelete && (
            <>
              <Text>
                Permanently delete your account, profile, meals, workouts and
                friendships? This cannot be undone.
              </Text>
              <Field
                label="Password to confirm deletion"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />
              <Action
                title="Permanently delete my account"
                danger
                disabled={task.saving}
                onPress={() =>
                  void task.run(async () => {
                    await api.request<void>("/auth/account", {
                      method: "DELETE",
                      body: { password: password(deletePassword) },
                    });
                    api.clearSession("Your account has been deleted.");
                  })
                }
              />
              <Action
                title="Cancel deletion"
                secondary
                disabled={task.saving}
                onPress={() => {
                  setConfirmDelete(false);
                  setDeletePassword("");
                }}
              />
            </>
          )}
        </Section>
      )}
      {info && (
        <InfoSheet
          title={info === "scan" ? "Schedule a Body Scan" : "Your Achievements"}
          onClose={() => setInfo(null)}
        >
          {info === "scan" ? (
            <Text>
              Body scan booking isn&apos;t available in GopherFit yet. Contact
              University Recreation & Wellness to arrange your scan.
            </Text>
          ) : (
            <Achievements summary={history.summary} />
          )}
        </InfoSheet>
      )}
    </Screen>
  );
}
