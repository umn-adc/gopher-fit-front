// The Storybook script generates its requires file. Only one entry runs.
if (process.env.EXPO_PUBLIC_ENVIRONMENT === "storybook") {
  const { registerRootComponent } = require("expo");
  registerRootComponent(require("./.rnstorybook").default);
} else {
  require("expo-router/entry");
}
