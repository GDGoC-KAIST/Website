const requiredVars = ["JWT_SECRET", "REFRESH_TOKEN_SECRET", "LINK_CODE_SECRET"] as const;

const nodeEnv = process.env.NODE_ENV ?? "development";
const isTest = nodeEnv === "test";

const testDefaults: Partial<Record<typeof requiredVars[number], string>> = {
  JWT_SECRET: "test-jwt-secret",
  REFRESH_TOKEN_SECRET: "test-refresh-secret",
  LINK_CODE_SECRET: "test-link-secret",
};

function resolveEnv(key: typeof requiredVars[number]): string {
  const value = process.env[key];
  if (value) return value;
  if (isTest) {
    return testDefaults[key] ?? `test-${key.toLowerCase()}`;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

const boolean = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
};

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 8080),
  logLevel: process.env.LOG_LEVEL ?? "info",
  jwtSecret: resolveEnv("JWT_SECRET"),
  refreshTokenSecret: resolveEnv("REFRESH_TOKEN_SECRET"),
  linkCodeSecret: resolveEnv("LINK_CODE_SECRET"),
  commitHash: process.env.COMMIT_HASH ?? "unknown",
  disableEmailSending: boolean(process.env.DISABLE_EMAIL_SENDING),
  disableGithubLogin: boolean(process.env.DISABLE_GITHUB_LOGIN),
};
