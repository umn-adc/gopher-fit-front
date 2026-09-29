import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { View } from "react-native";
import { Loading } from "../components/Form";
import { Text } from "../components/Themed";
import { palette } from "../constants/Design";
import { api, Session } from "./api";
import { credentialStore } from "./credentials";

// Native builds persist the refresh token; web keeps credentials in memory only.
api.setCredentialStore(credentialStore);

const AuthContext = createContext<Session | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(
    api.subscribe,
    api.getSession,
    () => null,
  );
  const [restoring, setRestoring] = useState(!!credentialStore);
  useEffect(() => {
    let active = true;
    void api.restore().finally(() => {
      if (active) setRestoring(false);
    });
    return () => {
      active = false;
    };
  }, []);
  if (restoring)
    return (
      <View
        accessibilityLabel="Signing you in"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
        }}
      >
        <Loading />
        <Text style={{ color: palette.muted }}>Signing you in…</Text>
      </View>
    );
  return (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
