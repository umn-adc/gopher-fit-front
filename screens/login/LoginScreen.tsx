import { useState } from "react";
import { Link, Redirect } from "expo-router";
import { View } from "react-native";
import { Action, Feedback, Field } from "../../components/Form";
import { AuthLayout } from "../../components/AuthLayout";
import { GradientIcon, ui } from "../../components/Design";
import { Text } from "../../components/Themed";
import { palette } from "../../constants/Design";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useTask } from "../../lib/hooks";
import { name, password } from "../../lib/validation";
export default function LoginScreen() {
  const session = useAuth();
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const task = useTask();
  if (session) return <Redirect href="/" />;
  const login = () =>
    void task.run(() =>
      api.login(name(username, "Username"), password(secret)),
    );
  return (
    <AuthLayout>
      <View style={[ui.card, { padding: 32, gap: 24 }]}>
        <View style={{ alignItems: "center", gap: 16, marginBottom: 12 }}>
          <GradientIcon name="sparkles" size={88} />
          <Text
            accessibilityRole="header"
            style={[ui.title, { textAlign: "center" }]}
          >
            Welcome to GopherFit
          </Text>
          <Text style={{ color: palette.muted, textAlign: "center" }}>
            Your goals. Your team. Your journey.
          </Text>
        </View>
        <Feedback message={api.getNotice()} />
        <Field
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          autoComplete="username"
        />
        <Field
          label="Password"
          placeholder="Enter your password"
          value={secret}
          onChangeText={setSecret}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={login}
        />
        <Link
          href="/recovery"
          style={{ alignSelf: "flex-end", color: palette.maroon, fontSize: 14 }}
        >
          Forgot password?
        </Link>
        <Feedback {...task} />
        <Action
          title={task.saving ? "Logging in…" : "Log in"}
          disabled={task.saving}
          onPress={login}
        />
        <Text
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: palette.muted,
            textAlign: "center",
          }}
        >
          Login lasts until you reload or close the app.
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: palette.border,
            paddingTop: 20,
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: palette.muted, fontSize: 14 }}>
            New to GopherFit?
          </Text>
          <Link
            href="/onboarding"
            style={{ color: palette.maroon, fontWeight: "600" }}
          >
            Create an account
          </Link>
        </View>
      </View>
    </AuthLayout>
  );
}
