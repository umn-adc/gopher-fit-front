import React from "react";
import { Text, View, StyleSheet } from "react-native";

interface HeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  gradientColors?: string[]; // TODO: Add gradient once nativewind has been set up
}


export default function Header({ title, subtitle, icon }: HeaderProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "white",
    minWidth: "100%",
    height: 113,
    padding: 24,
    borderRadius: 24,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.1)"
  },
  title: {
    fontSize: 30,
    fontWeight: 600,
    lineHeight: 36,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 24,
    letterSpacing: -0.31,
  },
  iconContainer: {
    flex: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "black",
    width: 56,
    height: 56,
  },
  textContainer: {
    flex: 1,
  },
});
