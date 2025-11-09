export default ({ config }) => ({
  ...config,
  name: 'Storybook Template',
  slug: 'storybook-template',
  extra: {
    storybookEnabled: process.env.STORYBOOK_ENABLED,
  },
});