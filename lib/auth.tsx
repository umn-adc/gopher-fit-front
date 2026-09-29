import { createContext, useContext, useSyncExternalStore } from "react";
import { api, Session } from "./api";

const AuthContext = createContext<Session | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(
    api.subscribe,
    api.getSession,
    () => null,
  );
  return (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
