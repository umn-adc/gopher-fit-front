const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
module.exports = withNativeWind(config, { input: './global.css' })
// Learn more https://docs.expo.io/guides/customizing-metro
/** @type {import('expo/metro-config').MetroConfig} */

// Only attempt to load Storybook's Metro helper when Storybook is explicitly enabled.
// Some Storybook packages are published as ESM and will throw when required from
// CommonJS. Guarding the require prevents Metro from failing to load the config
// when Storybook isn't in use.
if (process.env.EXPO_PUBLIC_ENVIRONMENT === "storybook") {
  try {
    const {
      withStorybook,
    } = require("@storybook/react-native/metro/withStorybook");
    module.exports = withStorybook(config, { enabled: true });
  } catch (err) {
    // Fall back to the default config and surface a warning; Metro can continue.
    // Keep the error message minimal to avoid noisy logs during normal runs.
    // eslint-disable-next-line no-console
    console.warn(
      "Warning: could not load @storybook/react-native/metro/withStorybook — falling back to default Metro config. " +
        (err && err.message ? err.message : ""),
    );
    module.exports = config;
  }
} else {
  module.exports = config;
}
