import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { SvgProps } from "react-native-svg";
import { Text } from "./Themed";
import { Progress } from "./Design";
import { palette } from "../constants/Design";
interface Props {
  numerator?: number;
  goal?: number | null;
  unit: string;
  stat: string;
  Icon: React.FC<SvgProps>;
  note?: string;
  showProgress?: boolean;
}
export function StatsBlob({
  numerator,
  goal,
  unit,
  stat,
  Icon,
  note,
  showProgress = true,
}: Props) {
  const wide = useWindowDimensions().width >= 760;
  return (
    <View
      style={[
        styles.card,
        wide && { flexBasis: 0, flexShrink: 1 },
        !showProgress && { minHeight: 205 },
      ]}
    >
      <Icon />
      <Text style={styles.title}>{stat}</Text>
      <Text style={styles.value}>
        <Text style={styles.current}>
          {numerator === undefined ? "—" : numerator.toLocaleString()}
        </Text>
        {goal != null ? ` / ${goal}` : ""}{" "}
        <Text style={styles.unit}>{unit}</Text>
      </Text>
      {showProgress && (
        <View style={{ marginTop: 32 }}>
          <Progress value={numerator} goal={goal} label={`${stat} progress`} />
        </View>
      )}
      {note && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 0,
    minHeight: 249,
    alignSelf: "flex-start",
    padding: 20,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 36 },
  value: { color: palette.muted, fontSize: 14, lineHeight: 32, marginTop: 26 },
  current: { color: palette.text, fontSize: 24, lineHeight: 32 },
  unit: { color: palette.muted, fontSize: 12 },
  note: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
