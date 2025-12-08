module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [require("path").join(__dirname, "tsconfig.eslint.json")],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
    ".eslintrc.js",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": 0,
    "import/no-unresolved": 0,
    "indent": 0,
    "new-cap": 0,
    "require-jsdoc": 0,
    "max-len": 0,
    "operator-linebreak": 0,
    "camelcase": 0,
    "valid-jsdoc": 0,
    "no-trailing-spaces": 0,
    "no-tabs": 0,
    "quote-props": 0,
    "object-curly-spacing": 0,
    "no-multi-spaces": 0,
    "padded-blocks": 0,
    "prefer-const": 0,
    "prefer-destructuring": 0,
    "@typescript-eslint/no-inferrable-types": 0,
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unused-vars": 0,
    "@typescript-eslint/no-non-null-assertion": 0,
    "@typescript-eslint/no-var-requires": 0,
  },
  overrides: [
    {
      files: ["tests/**/*.{ts,tsx}", "**/*.spec.ts"],
      env: {jest: true},
      parserOptions: {project: null},
    },
    {
      files: ["perf/**/*.js"],
      globals: {
        __ENV: "readonly",
        __VU: "readonly",
      },
      parserOptions: {project: null},
    },
  ],
};
