import { useId } from "react";
import { WorkoutGlyph } from "../assets/images/workoutsBlob";
import { ProteinGlyph } from "../assets/images/proteinBlob";
import { CaloriesGlyph } from "../assets/images/caloriesBlob";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { palette, radius } from "../constants/Design";
import { Text } from "./Themed";

export type IconName =
  | React.ComponentProps<typeof Feather>["name"]
  | "dumbbell"
  | "utensils"
  | "trophy"
  | "flame"
  | "sparkles";
export function Icon({
  name,
  size = 22,
  color = palette.maroon,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const glyphs = {
    dumbbell: WorkoutGlyph,
    utensils: ProteinGlyph,
    flame: CaloriesGlyph,
  };
  if (name in glyphs) {
    const Glyph = glyphs[name as keyof typeof glyphs];
    return (
      <Svg
        width={size}
        height={size}
        viewBox="12 12 24 24"
        fill="none"
        style={{ position: "relative" }}
      >
        <Glyph color={color} />
      </Svg>
    );
  }
  const extra = {
    trophy: "trophy-outline",
    sparkles: "creation-outline",
  } as const;
  if (name in extra)
    return (
      <MaterialCommunityIcons
        name={extra[name as keyof typeof extra]}
        size={size}
        color={color}
      />
    );
  return (
    <Feather
      name={name as React.ComponentProps<typeof Feather>["name"]}
      size={size}
      color={color}
    />
  );
}

export function Gradient({
  colors = [palette.maroon, palette.gold],
  diagonal = false,
}: {
  colors?: readonly [string, string];
  diagonal?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient
          id={id}
          x1="0%"
          y1="0%"
          x2={diagonal ? "100%" : "0%"}
          y2="100%"
        >
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      {/* Fixed SVG coordinates scale with the viewport. Android can retain the
          cached path of a percentage-sized Rect when only its parent resizes. */}
      <Rect width={1} height={1} fill={`url(#${id})`} />
    </Svg>
  );
}

export function GradientIcon({
  name,
  size = 56,
  colors,
}: {
  name: IconName;
  size?: number;
  colors?: readonly [string, string];
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Gradient colors={colors} />
      <Icon name={name} color="white" size={size * 0.48} />
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  colors,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  colors?: readonly [string, string];
}) {
  return (
    <View style={ui.header}>
      {icon && <GradientIcon name={icon} colors={colors} />}
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={ui.title}>
          {title}
        </Text>
        {subtitle && <Text style={{ color: palette.muted }}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function Badge({
  children,
  filled = false,
}: {
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <View
      style={[
        ui.badge,
        filled && {
          backgroundColor: palette.maroon,
          borderColor: palette.maroon,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          lineHeight: 17,
          fontWeight: "600",
          color: filled ? "white" : palette.text,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function Progress({
  value,
  goal,
  label,
}: {
  value?: number;
  goal?: number | null;
  label: string;
}) {
  const percent =
    value !== undefined && goal != null && goal > 0
      ? Math.max(0, Math.min(100, (value / goal) * 100))
      : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={ui.track}
    >
      <View
        style={{
          backgroundColor: palette.maroon,
          height: "100%",
          width: `${percent}%`,
        }}
      />
    </View>
  );
}

export function Avatar({
  name,
  size = 48,
  muted = false,
}: {
  name: string;
  size?: number;
  muted?: boolean;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 2,
        backgroundColor: muted ? "#efeff1" : palette.maroon,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: muted ? palette.text : "white" }}>{initials}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: IconName;
  title: string;
  detail?: string;
}) {
  return (
    <View style={ui.empty}>
      <View style={ui.emptyIcon}>
        <Icon name={icon} size={26} />
      </View>
      <Text style={{ textAlign: "center", fontWeight: "600" }}>{title}</Text>
      {detail && <Text style={ui.emptyDetail}>{detail}</Text>}
    </View>
  );
}

export function InfoSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={ui.overlay}>
        <View accessibilityViewIsModal style={ui.dialog}>
          <View style={ui.between}>
            <Text
              accessibilityRole="header"
              style={{ fontSize: 22, fontWeight: "600", flex: 1 }}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={ui.iconButton}
            >
              <Icon name="x" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ gap: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Tile({
  title,
  detail,
  icon,
  onPress,
  gold,
  style,
}: {
  title: string;
  detail: string;
  icon: IconName;
  onPress: () => void;
  gold?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      cssInterop={false}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [ui.tile, style, pressed && { opacity: 0.7 }]}
    >
      <Icon
        name={icon}
        size={30}
        color={gold ? palette.gold : palette.maroon}
      />
      <Text style={{ marginTop: 28 }}>{title}</Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          color: palette.muted,
          marginTop: 26,
        }}
      >
        {detail}
      </Text>
    </Pressable>
  );
}

export const ui = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.card,
    padding: 24,
    gap: 20,
  },
  header: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.card,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 108,
  },
  title: { fontSize: 30, lineHeight: 37, fontWeight: "700" },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  half: { width: "47.5%", flexGrow: 1 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  badge: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 30,
    paddingHorizontal: 9,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  track: {
    height: 8,
    backgroundColor: palette.track,
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
  },
  softRow: {
    backgroundColor: palette.warm,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  empty: { paddingVertical: 22, alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.maroonSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDetail: {
    textAlign: "center",
    color: palette.muted,
    maxWidth: 340,
    fontSize: 14,
    lineHeight: 22,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 15, 20, .35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxHeight: "90%",
    maxWidth: 480,
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 24,
    gap: 24,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tile: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.card,
    padding: 24,
    minHeight: 180,
  },
});
