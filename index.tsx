import { registerRootComponent } from "expo";
import StorybookUI from "./.rnstorybook";
import "expo-router/entry";

if (process.env.EXPO_PUBLIC_ENVIRONMENT === "storybook") {
  registerRootComponent(StorybookUI);
} else {
  // Expo Router will handle the registration via its entry point
  require("expo-router/entry");
}
