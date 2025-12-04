import type {Response} from "supertest";

export function assertOk(res: Response, label: string, expected: number): void {
  if (res.status !== expected) {
    // eslint-disable-next-line no-console
    console.error(`[${label}] Failed! Expected ${expected}, got ${res.status}`);
    // eslint-disable-next-line no-console
    console.error(`[${label}] Response Body:`, JSON.stringify(res.body, null, 2));
    // eslint-disable-next-line no-console
    console.error(`[${label}] Response Text:`, res.text);
    throw new Error(`[${label}] Status mismatch: ${res.status} != ${expected}`);
  }
}
