import crypto from "node:crypto";

export function hashIp(ip: string | undefined | null, salt: string): string {
  if (!ip) return "unknown";
  const normalized = ip.replace(/^::ffff:/, "");
  return crypto.createHash("sha256").update(`${salt}|${normalized}`).digest("hex");
}
