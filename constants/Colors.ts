import { palette } from "./Design";

const theme = {
  text: palette.text,
  background: palette.background,
  tint: palette.maroon,
  tabIconDefault: palette.muted,
  tabIconSelected: palette.maroon,
};

export default {
  light: theme,
  // The supplied design has one light appearance, including on dark-mode devices.
  dark: theme,
};
