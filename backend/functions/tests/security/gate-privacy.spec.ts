import {describe, expect, it, jest} from "@jest/globals";
import type {Firestore} from "firebase-admin/firestore";
import {VisitorSessionService} from "../../src/services/visitorSessionService";
import type {TelemetryData} from "../../src/types/telemetry";

jest.mock("../../src/repositories/opsAggRepo", () => ({
  incrementCounters: jest.fn(async () => undefined),
}));

class FakeDocRef {
  constructor(public readonly __key: string) {}
}

class FakeDb {
  private store = new Map<string, Record<string, unknown>>();

  private readonly txApi = {
    get: async (ref: FakeDocRef) => {
      const data = this.store.get(ref.__key);
      return {exists: data !== undefined, data: () => ({...(data ?? {})})};
    },
    set: (ref: FakeDocRef, data: Record<string, unknown>, opts?: {merge?: boolean}) => {
      const existing = this.store.get(ref.__key) ?? {};
      this.store.set(ref.__key, opts?.merge ? {...existing, ...data} : data);
    },
  };

  collection(name: string) {
    return {
      doc: (id: string) => new FakeDocRef(`${name}/${id}`),
    };
  }

  async runTransaction<T>(fn: (tx: typeof this.txApi) => Promise<T>): Promise<T> {
    return fn(this.txApi);
  }

  batch() {
    return {
      set: (ref: FakeDocRef, data: Record<string, unknown>) => {
        const existing = this.store.get(ref.__key) ?? {};
        this.store.set(ref.__key, {...existing, ...data});
      },
      commit: async () => undefined,
    };
  }

  allData(): Record<string, unknown>[] {
    return Array.from(this.store.values());
  }
}

describe("Security Gate – privacy", () => {
  it("never writes raw IP or UA fields and retains hashed summaries", async () => {
    const fakeDb = new FakeDb();
    const service = new VisitorSessionService(fakeDb as unknown as Firestore);

    const telemetry: TelemetryData = {
      visitorId: "sec-test",
      ipHash: "hash-123",
      uaSummary: {browser: "Chrome", os: "macOS", device: "desktop", isBot: false},
      path: "/v2/healthz",
      method: "GET",
    };

    await service.upsertSession(telemetry, 5 * 60 * 1000);

    const payloads = fakeDb.allData();
    expect(payloads.length).toBeGreaterThan(0);

    const forbidden = ["ip", "userAgent", "ua", "fullUrl", "rawIp", "userAgentRaw"];
    for (const payload of payloads) {
      forbidden.forEach((key) => {
        expect(Object.prototype.hasOwnProperty.call(payload, key)).toBe(false);
      });
    }

    const hasIpHash = payloads.some((p) => Object.prototype.hasOwnProperty.call(p, "ipHash"));
    const hasUaSummary = payloads.some((p) => Object.prototype.hasOwnProperty.call(p, "uaSummary"));
    expect(hasIpHash).toBe(true);
    expect(hasUaSummary).toBe(true);
  });
});
