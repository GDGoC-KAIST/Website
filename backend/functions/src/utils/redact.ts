export const REDACT_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "email",
  "phone",
  "studentid",
]);

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value instanceof Buffer) {
      return "[Buffer]";
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      if (REDACT_KEYS.has(normalizedKey)) {
        result[key] = "*****";
        continue;
      }
      result[key] = redactValue(val);
    }
    return result;
  }

  return value;
}

export function redact<T>(obj: T): T {
  return redactValue(obj) as T;
}
