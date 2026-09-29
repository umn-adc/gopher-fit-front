import { useState, useSyncExternalStore } from "react";
import { Link, useRouter } from "expo-router";
import {
  Action,
  Feedback,
  Field,
  Screen,
  Section,
} from "../../components/Form";
import { Text } from "../../components/Themed";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useTask } from "../../lib/hooks";
import {
  clearRecoveryLink,
  readRecoveryLink,
  subscribeRecoveryLink,
} from "../../lib/recovery";
import { name, password, passwordHelp } from "../../lib/validation";
export default function Recovery() {
  const session = useAuth();
  const router = useRouter();
  const link = useSyncExternalStore(
    subscribeRecoveryLink,
    readRecoveryLink,
    () => null,
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const task = useTask();
  const validLink =
    link &&
    ["verify", "reset"].includes(link.purpose) &&
    link.token.length >= 20 &&
    link.token.length <= 200;
  function clearLink() {
    clearRecoveryLink();
  }
  return (
    <Screen title="Account recovery">
      <Feedback {...task} />
      {link ? (
        <Section
          title={
            link.purpose === "verify"
              ? "Verify recovery address"
              : "Reset password"
          }
        >
          {!validLink ? (
            <Text>This recovery link is invalid. Request a new one.</Text>
          ) : link.purpose === "verify" ? (
            <>
              <Text>Confirm the recovery address from this email link.</Text>
              <Action
                title={task.saving ? "Confirming…" : "Confirm recovery address"}
                disabled={task.saving}
                onPress={() =>
                  void task.run(async () => {
                    await api.request<void>("/auth/recovery-address/confirm", {
                      public: true,
                      method: "POST",
                      body: { token: link.token },
                    });
                    clearLink();
                  }, "Recovery address confirmed.")
                }
              />
            </>
          ) : (
            <>
              <Field
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <Text>{passwordHelp}</Text>
              <Action
                title={task.saving ? "Resetting…" : "Reset password"}
                disabled={task.saving}
                onPress={() =>
                  void task.run(async () => {
                    await api.request<void>("/auth/recovery/reset", {
                      public: true,
                      method: "POST",
                      body: {
                        token: link.token,
                        new_password: password(newPassword, true),
                      },
                    });
                    clearLink();
                    api.clearSession(
                      "Password reset. Please log in with your new password.",
                    );
                    router.replace("/login");
                  })
                }
              />
            </>
          )}
          <Action
            title="Discard link and request a new one"
            secondary
            disabled={task.saving}
            onPress={clearLink}
          />
          <Text>
            Links expire and can be used only once. If a request fails after
            submission, the link may already have been used.
          </Text>
        </Section>
      ) : (
        <>
          <Section title="Request a reset">
            <Field
              label="Account username"
              value={username}
              onChangeText={setUsername}
            />
            <Action
              title={task.saving ? "Requesting…" : "Request recovery email"}
              disabled={task.saving}
              onPress={() =>
                void task.run(async () => {
                  await api.request<{ message: string }>(
                    "/auth/recovery/request",
                    {
                      public: true,
                      method: "POST",
                      body: { username: name(username, "Username") },
                    },
                  );
                }, "Request accepted. If this account has a verified recovery address, instructions will be sent. Acceptance does not confirm email delivery.")
              }
            />
            <Text>
              You must have enrolled and verified a recovery address before
              losing access.
            </Text>
          </Section>
          {session && (
            <Section title="Set up or replace recovery address">
              <Field
                label="Recovery email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />
              <Field
                label="Current password"
                value={confirmation}
                onChangeText={setConfirmation}
                secureTextEntry
                autoComplete="current-password"
              />
              <Action
                title="Send verification email"
                disabled={task.saving}
                onPress={() =>
                  void task.run(async () => {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                      throw new Error("Enter a valid email address.");
                    await api.request<{ message: string }>(
                      "/auth/recovery-address",
                      {
                        method: "PUT",
                        body: { email, password: password(confirmation) },
                      },
                    );
                    setConfirmation("");
                  }, "Verification requested. Check your email; acceptance does not confirm delivery or verification.")
                }
              />
              <Text>
                Recovery address status is not available here. Follow the email
                link to verify an address.
              </Text>
            </Section>
          )}
        </>
      )}
      <Text>
        Recovery may be unavailable until the server has email delivery
        configured.
      </Text>
      <Link href={session ? "/profile" : "/login"}>
        {session ? "Back to Profile" : "Back to login"}
      </Link>
    </Screen>
  );
}
