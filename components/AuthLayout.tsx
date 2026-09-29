import { useId } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const id = useId().replace(/:/g, "");
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f3f0" }}>
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id={id} x1="0%" y1="20%" x2="100%" y2="80%">
            <Stop offset="0" stopColor="#d3b4bb" />
            <Stop offset="0.52" stopColor="#f6f4f4" />
            <Stop offset="1" stopColor="#fbebba" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={Platform.OS !== "web"}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: Math.max(32, insets.top + 20),
            paddingBottom: Math.max(32, insets.bottom + 20),
          }}
        >
          <View style={{ width: "100%", maxWidth: 480, gap: 32 }}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
