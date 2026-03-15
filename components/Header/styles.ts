import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "white",
    minWidth: "100%",
    minHeight: 113,
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
