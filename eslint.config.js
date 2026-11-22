// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".opencode/**"],
    rules: {
      "max-lines": ["error", { "max": 450, "skipBlankLines": true, "skipComments": true }],
    },
  },
]);
