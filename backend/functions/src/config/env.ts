const requiredVars = [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "LINK_CODE_SECRET",
  "IP_HASH_SALT",
  "ABUSE_GUARD_STORE",
] as const;
const mailjetVars = ["MAILJET_API_KEY", "MAILJET_API_SECRET"] as const;

const nodeEnv = process.env.NODE_ENV ?? "development";
const isTest = nodeEnv === "test";
const isProd = nodeEnv === "production";

const testDefaults: Partial<Record<typeof requiredVars[number], string>> = {
  JWT_SECRET: "test-jwt-secret",
  REFRESH_TOKEN_SECRET: "test-refresh-secret",
  LINK_CODE_SECRET: "test-link-secret",
  IP_HASH_SALT: "test-ip-hash-salt",
  ABUSE_GUARD_STORE: "firestore",
};

function resolveEnv(key: typeof requiredVars[number]): string {
  const value = process.env[key];
  if (value) return value;
  if (isTest) {
    return testDefaults[key] ?? `test-${key.toLowerCase()}`;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

function resolveAbuseStore(value: string): "firestore" | "redis" {
  const normalized = value.toLowerCase();
  if (normalized === "firestore" || normalized === "redis") {
    return normalized;
  }
  throw new Error(`Invalid ABUSE_GUARD_STORE value: ${value}. Use "firestore" or "redis".`);
}

function resolveMailjetEnv(key: typeof mailjetVars[number]): string | undefined {
  const value = process.env[key];
  if (value) return value;
  if (isProd) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return undefined;
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
  mailjetApiKey: resolveMailjetEnv("MAILJET_API_KEY"),
  mailjetApiSecret: resolveMailjetEnv("MAILJET_API_SECRET"),
  emailFrom: process.env.EMAIL_FROM ?? "noreply@gdgockaist.com",
  emailFromName: process.env.EMAIL_FROM_NAME ?? "GDGoC KAIST",
  ipHashSalt: resolveEnv("IP_HASH_SALT"),
  abuseGuardStore: resolveAbuseStore(resolveEnv("ABUSE_GUARD_STORE")),
};
