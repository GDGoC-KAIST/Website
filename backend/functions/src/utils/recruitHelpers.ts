import {RecruitConfig} from "../types/recruit";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateConfig(config?: RecruitConfig | null): boolean {
  if (!config || !config.isOpen) {
    return false;
  }

  const now = Date.now();
  const openAt = config.openAt.toMillis();
  const closeAt = config.closeAt.toMillis();

  return now >= openAt && now <= closeAt;
}

export function assertApplicationOpen(config?: RecruitConfig | null): void {
  if (validateConfig(config)) {
    return;
  }

  const error = new Error("Recruiting is currently closed");
  (error as Error & {status?: number}).status = 403;
  throw error;
}
