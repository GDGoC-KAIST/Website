process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT ?? "gdgoc-backend-test";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: [
    "<rootDir>/tests/integration/**/*.spec.ts",
    "<rootDir>/tests/contract/**/*.spec.ts",
    "<rootDir>/tests/security/**/*.spec.ts",
    "<rootDir>/tests/smoke/**/*.spec.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
};
