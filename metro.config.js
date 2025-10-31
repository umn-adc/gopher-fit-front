// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
module.exports = withStorybook(config, {
    enabled: process.env.STORYBOOK_ENABLED === 'true',
});