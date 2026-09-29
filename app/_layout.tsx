import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { palette } from "../constants/Design";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../lib/auth";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro resolves bundled font assets via require.
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const session = useAuth();
  const router = useRouter();
  const hadSession = useRef(!!session);
  useEffect(() => {
    // An accessible recovery screen may be behind a protected tab in history.
    // Session invalidation must always land on login, regardless of that history.
    if (hadSession.current && !session) router.replace("/login");
    hadSession.current = !!session;
  }, [session, router]);

  return (
    <ThemeProvider
      value={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: palette.background,
          primary: palette.maroon,
        },
      }}
    >
      <StatusBar style="dark" />
      <Stack key={session?.generation ?? "signed-out"}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "About GopherFit" }}
          />
        </Stack.Protected>
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="recovery" options={{ title: "Account recovery" }} />
      </Stack>
    </ThemeProvider>
  );
}
