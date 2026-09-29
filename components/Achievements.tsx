import { View } from "react-native";
import { Text } from "./Themed";
import { palette } from "../constants/Design";
import { ui } from "./Design";
import type { workoutSummary } from "../lib/fitness";

export function Achievements({
  summary,
}: {
  summary: ReturnType<typeof workoutSummary> | null;
}) {
  const badges = [
    {
      emoji: "🔥",
      name: "Fire Starter",
      detail: "7 day workout streak",
      earned: !!summary && summary.longest >= 7,
    },
    {
      emoji: "💪",
      name: "Iron Champion",
      detail: "100 logged workouts",
      earned: !!summary && summary.total >= 100,
    },
    {
      emoji: "🏃",
      name: "First Steps",
      detail: "Log your first workout",
      earned: !!summary && summary.total >= 1,
    },
    {
      emoji: "🏅",
      name: "Showing Up",
      detail: "25 logged workouts",
      earned: !!summary && summary.total >= 25,
    },
    {
      emoji: "⚡",
      name: "In the Zone",
      detail: "60 exercise minutes",
      earned: !!summary && summary.minutes >= 60,
    },
    {
      emoji: "🎯",
      name: "Going the Distance",
      detail: "600 exercise minutes",
      earned: !!summary && summary.minutes >= 600,
    },
  ];
  return (
    <View style={ui.grid}>
      {badges.map((badge) => (
        <View
          key={badge.name}
          accessibilityLabel={`${badge.name}: ${badge.earned ? "earned" : "locked"}. ${badge.detail}`}
          style={[
            ui.half,
            {
              minHeight: 132,
              borderWidth: 1,
              borderColor: badge.earned ? "#d9a8b3" : palette.border,
              borderRadius: 18,
              backgroundColor: badge.earned ? "#f8efea" : palette.warm,
              padding: 16,
              alignItems: "center",
              gap: 6,
              opacity: summary && !badge.earned ? 0.5 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 28, lineHeight: 38 }}>{badge.emoji}</Text>
          <Text style={{ fontSize: 14, textAlign: "center" }}>
            {badge.name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              textAlign: "center",
              color: palette.muted,
            }}
          >
            {badge.detail}
          </Text>
        </View>
      ))}
    </View>
  );
}
