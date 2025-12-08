export type CheckResult = {
  allowed: boolean;
  blockedUntil?: number;
  remaining: number;
};

export interface AbuseGuardStore {
  checkAndRecord(key: string, limit: number, windowSec: number, penaltySec: number): Promise<CheckResult>;
}
