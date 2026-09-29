import { useCallback, useState } from "react";
import { Link, Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  BackHandler,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Action, Feedback, Field } from "../../components/Form";
import { emptyProfile, profileInput } from "../../components/ProfileFields";
import { AuthLayout } from "../../components/AuthLayout";
import { Gopher } from "../../components/Gopher";
import { Gradient, Icon } from "../../components/Design";
import { Text } from "../../components/Themed";
import { palette } from "../../constants/Design";
import { api } from "../../lib/api";
import { activities, genders } from "../../lib/api-types";
import { useAuth } from "../../lib/auth";
import { useTask } from "../../lib/hooks";
import {
  name,
  numberValue,
  password,
  passwordHelp,
} from "../../lib/validation";
import { inchesToCm, poundsToKg } from "../../lib/fitness";

const sports = [
  "Football",
  "Basketball",
  "Hockey",
  "Soccer",
  "Baseball",
  "Softball",
  "Volleyball",
  "Track & Field",
  "Swimming",
  "Wrestling",
  "Gymnastics",
  "Martial Arts",
  "Tennis",
  "Running",
  "Cycling",
  "Other",
];
const goals = [
  "Lose Weight",
  "Build Muscle",
  "Increase Endurance",
  "Improve Flexibility",
  "General Fitness",
  "Athletic Performance",
  "Rehab/Recovery",
  "Maintain Weight",
];
const descriptions = [
  "Little to no exercise",
  "Exercise 1–3 days/week",
  "Exercise 3–5 days/week",
  "Exercise 6–7 days/week",
  "Physical job + exercise",
];
const titles = [
  "Welcome to\nGopherFit",
  "What's your name?",
  "How old are you?",
  "Body Stats",
  "Gender",
  "Your Sports",
  "Fitness Goals",
  "Activity Level",
  "Create your account",
];
const subtitles = [
  "Your personalized fitness companion\nat the University of Minnesota",
  "Let's get to know you!",
  "This helps us personalize your experience",
  "Help us calculate your calorie needs",
  "For accurate calorie calculations",
  "Select all that apply",
  "What do you want to achieve?",
  "How active are you typically?",
  "Save your profile and start your journey",
];

export default function Onboarding() {
  const session = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [draft, setDraft] = useState({ ...emptyProfile, age: "" });
  const [inches, setInches] = useState("");
  const [pounds, setPounds] = useState("");
  const task = useTask();
  const { saving, setError } = task;
  const back = useCallback(() => {
    if (saving) return;
    Keyboard.dismiss();
    setError("");
    if (step > 0) setStep(step - 1);
    // Pops to login when it exists; replaces this route after a direct deep link.
    else router.dismissTo("/login");
  }, [router, saving, setError, step]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          back();
          return true;
        },
      );
      return () => subscription.remove();
    }, [back]),
  );
  if (session) return <Redirect href="/" />;
  const toggle = (key: "sports" | "goals", value: string) => {
    const selected = draft[key].split("\n").filter(Boolean);
    setDraft({
      ...draft,
      [key]: (selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
      ).join("\n"),
    });
  };
  const selected = (key: "sports" | "goals", value: string) =>
    draft[key].split("\n").includes(value);
  function next() {
    try {
      if (step === 1) name(draft.name);
      if (step === 2 && numberValue(draft.age, "Age", true, 130) < 1)
        throw new Error("Enter your age to continue.");
      if (step === 3)
        setDraft({
          ...draft,
          height: inchesToCm(inches),
          weight: poundsToKg(pounds),
        });
      if (step === 4 && !draft.gender)
        throw new Error("Choose a gender to continue.");
      if (step === 7 && !draft.activity_level)
        throw new Error("Choose your activity level to continue.");
      Keyboard.dismiss();
      task.setError("");
      setStep(step + 1);
    } catch (e) {
      task.setError((e as Error).message);
    }
  }
  return (
    <AuthLayout>
      <View style={{ gap: 8 }}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Onboarding progress"
          accessibilityValue={{ min: 1, max: 8, now: Math.min(step + 1, 8) }}
          style={s.track}
        >
          <View
            style={{
              height: "100%",
              width: `${(Math.min(step + 1, 8) / 8) * 100}%`,
            }}
          >
            <Gradient />
          </View>
        </View>
        <Text style={s.step}>
          {step < 8 ? `Step ${step + 1} of 8` : "One last thing"}
        </Text>
      </View>
      <View style={s.card}>
        <View style={{ flex: 1, gap: 12 }}>
          {step === 0 && (
            <View style={s.welcomeIcon}>
              <Gradient />
              <Icon name="sparkles" size={64} color="white" />
            </View>
          )}
          <Text
            accessibilityRole="header"
            style={[
              s.title,
              step === 0 && {
                fontSize: 38,
                lineHeight: 42,
                fontWeight: "400",
                marginTop: 14,
              },
            ]}
          >
            {titles[step]}
          </Text>
          <Text
            style={[
              s.subtitle,
              step === 0 && { fontSize: 18, lineHeight: 28, marginTop: 14 },
            ]}
          >
            {subtitles[step]}
          </Text>
          {[1, 2, 3, 6].includes(step) && (
            <View style={[s.mascot, step === 6 && { marginVertical: 28 }]}>
              <Gopher />
            </View>
          )}
          {step === 1 && (
            <Field
              label="Name"
              placeholder="Enter your name"
              value={draft.name}
              autoComplete="name"
              autoCapitalize="words"
              onChangeText={(value) => setDraft({ ...draft, name: value })}
            />
          )}
          {step === 2 && (
            <Field
              label="Age"
              placeholder="Enter your age"
              value={draft.age}
              keyboardType="number-pad"
              onChangeText={(age) => setDraft({ ...draft, age })}
            />
          )}
          {step === 3 && (
            <>
              <Field
                label="Height (inches)"
                placeholder="e.g., 70"
                value={inches}
                keyboardType="decimal-pad"
                onChangeText={setInches}
              />
              <Field
                label="Weight (lbs)"
                placeholder="e.g., 170"
                value={pounds}
                keyboardType="decimal-pad"
                onChangeText={setPounds}
              />
            </>
          )}
          {step === 4 && (
            <View style={s.genders}>
              {genders.map((gender) => (
                <Pressable
                  key={gender}
                  accessibilityRole="button"
                  accessibilityLabel={gender}
                  accessibilityState={{ selected: draft.gender === gender }}
                  onPress={() => setDraft({ ...draft, gender })}
                  style={[s.gender, draft.gender === gender && s.selected]}
                >
                  <Gopher size={80} />
                  <Text>{gender}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {step === 5 && (
            <>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="I'm a UMN Varsity Athlete"
                accessibilityState={{
                  checked: selected("sports", "UMN Varsity Athlete"),
                }}
                onPress={() => toggle("sports", "UMN Varsity Athlete")}
                style={[s.varsity, { marginVertical: 20 }]}
              >
                <View
                  style={[
                    s.checkbox,
                    selected("sports", "UMN Varsity Athlete") && {
                      backgroundColor: palette.maroon,
                    },
                  ]}
                >
                  {selected("sports", "UMN Varsity Athlete") && (
                    <Icon name="check" size={12} color="white" />
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>
                  I&apos;m a UMN Varsity Athlete
                </Text>
              </Pressable>
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 390 }}
                contentContainerStyle={s.grid}
              >
                {sports.map((sport) => (
                  <Pressable
                    key={sport}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected("sports", sport) }}
                    onPress={() => toggle("sports", sport)}
                    style={[s.choice, selected("sports", sport) && s.selected]}
                  >
                    <Text>{sport}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          {step === 6 && (
            <View style={s.grid}>
              {goals.map((goal) => (
                <Pressable
                  key={goal}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected("goals", goal) }}
                  onPress={() => toggle("goals", goal)}
                  style={[s.choice, selected("goals", goal) && s.selected]}
                >
                  <Text style={{ fontWeight: "600" }}>{goal}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {step === 7 && (
            <View style={{ gap: 12, marginTop: 20 }}>
              {activities.map((activity, index) => (
                <Pressable
                  key={activity}
                  accessibilityRole="button"
                  accessibilityLabel={activity}
                  accessibilityState={{
                    selected: draft.activity_level === activity,
                  }}
                  onPress={() =>
                    setDraft({ ...draft, activity_level: activity })
                  }
                  style={[
                    s.activity,
                    draft.activity_level === activity && s.selected,
                  ]}
                >
                  <Text style={{ fontWeight: "600" }}>{activity}</Text>
                  <Text
                    style={{ fontSize: 14, lineHeight: 20, color: "#646467" }}
                  >
                    {descriptions[index]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {step === 8 && (
            <View style={{ gap: 16, marginTop: 24 }}>
              <Field
                label="Username"
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
              />
              <Field
                label="Password"
                value={secret}
                onChangeText={setSecret}
                secureTextEntry
                autoComplete="new-password"
              />
              <Text
                style={{ fontSize: 12, lineHeight: 18, color: palette.muted }}
              >
                {passwordHelp}
              </Text>
            </View>
          )}
        </View>
        <Feedback {...task} />
        <View style={s.footer}>
          <Action
            title="Back"
            icon="chevron-left"
            compact
            secondary
            disabled={task.saving}
            onPress={back}
          />
          <Action
            title={
              step === 8
                ? task.saving
                  ? "Creating account…"
                  : "Create account"
                : step === 7
                  ? "Get Started"
                  : "Continue"
            }
            compact
            disabled={task.saving}
            endIcon="chevron-right"
            onPress={
              step < 8
                ? next
                : () =>
                    void task.run(() =>
                      api.register({
                        ...profileInput(draft),
                        username: name(username, "Username"),
                        password: password(secret, true),
                      }),
                    )
            }
          />
        </View>
      </View>
      {step === 8 && (
        <Link
          href="/login"
          style={{ textAlign: "center", color: palette.maroon, fontSize: 14 }}
        >
          Already have an account? Log in
        </Link>
      )}
    </AuthLayout>
  );
}
const s = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: "#fcfcfb",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  step: { textAlign: "center", color: palette.muted, fontSize: 14 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 32,
    minHeight: 500,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: palette.muted,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  welcomeIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  mascot: { alignItems: "center", marginTop: 42, marginBottom: 10 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: 32,
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  genders: { flexDirection: "row", gap: 16, marginTop: 20 },
  gender: {
    flex: 1,
    minHeight: 180,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  selected: { borderColor: palette.maroon, backgroundColor: "#fcf7f9" },
  varsity: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  choice: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 58,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "center",
  },
  activity: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 24,
    gap: 2,
  },
});
