const baseConfig = require("./jest.config.js");

module.exports = {
  ...baseConfig,
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFiles: [],
  setupFilesAfterEnv: [],
  testMatch: ["<rootDir>/tests/contract/**/*.spec.ts"],
  testEnvironment: "node",
};
