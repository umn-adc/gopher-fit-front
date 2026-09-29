import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
  View as NativeView,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from "react-native";
import { Text, View, useThemeColor } from "./Themed";
import { palette, radius } from "../constants/Design";
import { Icon, PageHeader, type IconName } from "./Design";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Screen({
  title,
  children,
  subtitle,
  icon,
  colors,
  hideHeader,
  scrollRef,
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  icon?: IconName;
  colors?: readonly [string, string];
  hideHeader?: boolean;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const backgroundColor = useThemeColor({}, "background");
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.screen,
        {
          paddingTop: Math.max(24, insets.top + 12),
          paddingBottom: 120 + insets.bottom,
        },
      ]}
    >
      <View testID="screen-content" style={styles.content}>
        {!hideHeader && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            icon={icon}
            colors={colors}
          />
        )}
        {children}
      </View>
    </ScrollView>
  );
}
export function Section({
  title,
  children,
  style,
  onLayout,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View style={[styles.section, style]} onLayout={onLayout}>
      {title && (
        <Text accessibilityRole="header" style={styles.heading}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const color = useThemeColor({}, "text");
  return (
    <NativeView style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={palette.muted}
        {...props}
        style={[styles.input, { color }, props.style]}
      />
    </NativeView>
  );
}
export function Action({
  title,
  onPress,
  disabled,
  secondary,
  danger,
  icon,
  compact,
  endIcon,
  style,
  accessibilityLabel = title,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: IconName;
  compact?: boolean;
  endIcon?: IconName;
  style?: StyleProp<ViewStyle>;
  // Distinguishes repeated titles, e.g. one "Send request" per search result.
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      // These inline styles need React Native's pressed-state callback. NativeWind
      // otherwise flattens the callback to an empty object on native platforms.
      cssInterop={false}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        compact && { paddingVertical: 6, paddingHorizontal: 12 },
        danger && { borderColor: "#bd3651" },
        style,
        { opacity: disabled ? 0.65 : pressed ? 0.8 : 1 },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          color={secondary ? palette.text : palette.white}
        />
      )}
      <Text
        style={{
          color:
            danger && secondary
              ? "#bd3651"
              : secondary
                ? palette.text
                : "white",
          fontWeight: "600",
          fontSize: 14,
          lineHeight: 20,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {endIcon && (
        <Icon
          name={endIcon}
          size={16}
          color={secondary ? palette.text : palette.white}
        />
      )}
    </Pressable>
  );
}
export function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <NativeView style={{ gap: 8 }}>
      <Text>{label}</Text>
      <NativeView style={styles.row}>
        {options.map((option) => (
          <Action
            key={option}
            title={option}
            secondary={value !== option}
            onPress={() => onChange(option)}
          />
        ))}
      </NativeView>
    </NativeView>
  );
}
export function Feedback({
  error,
  message,
  saving,
}: {
  error?: string;
  message?: string;
  saving?: boolean;
}) {
  if (!error && !message && !saving) return null;
  return (
    <Text
      accessibilityRole={error ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={{ color: error ? "#bd3651" : "#33845b", lineHeight: 22 }}
    >
      {saving ? "Saving…" : error || message}
    </Text>
  );
}
export function Loading() {
  return (
    <ActivityIndicator
      accessibilityLabel="Loading"
      color={palette.maroon}
      style={{ margin: 12 }}
    />
  );
}
export const styles = StyleSheet.create({
  screen: { flexGrow: 1, paddingHorizontal: 16, alignItems: "center" },
  content: { width: "100%", maxWidth: 900, gap: 24 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  heading: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
  section: {
    gap: 16,
    padding: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.card,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.input,
    backgroundColor: palette.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: palette.maroon,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.maroon,
    minHeight: 48,
    minWidth: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondary: { backgroundColor: palette.surface, borderColor: palette.border },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
