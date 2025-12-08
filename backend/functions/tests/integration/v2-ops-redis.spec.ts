import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import type Redis from "ioredis";
import {RedisAbuseGuardStore} from "../../src/services/abuseGuard/redisAbuseGuardStore";

class FakeRedis implements Pick<Redis, "get" | "ttl" | "incr" | "expire" | "setex"> {
  private store = new Map<string, {value: number | string; expireAt?: number}>();

  private now(): number {
    return Date.now();
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expireAt && entry.expireAt <= this.now()) {
      this.store.delete(key);
      return null;
    }
    return String(entry.value);
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expireAt) return -1;
    const ttlMs = entry.expireAt - this.now();
    if (ttlMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil(ttlMs / 1000);
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || (entry.expireAt && entry.expireAt <= this.now())) {
      this.store.set(key, {value: 1, expireAt: entry?.expireAt});
      return 1;
    }
    const next = Number(entry.value) + 1;
    this.store.set(key, {value: next, expireAt: entry.expireAt});
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expireAt = this.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    this.store.set(key, {value, expireAt: this.now() + seconds * 1000});
    return "OK";
  }
}

describe("Redis Abuse Guard Store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("blocks after exceeding limit and respects penalty TTL", async () => {
    const redis = new FakeRedis();
    const store = new RedisAbuseGuardStore(redis as unknown as Redis);
    const limit = 3;
    const windowSec = 60;
    const penaltySec = 120;

    // First three allowed
    for (let i = 0; i < limit; i += 1) {
      const res = await store.checkAndRecord("recruit:login", limit, windowSec, penaltySec);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(limit - (i + 1));
    }

    // Next call blocked
    const blocked = await store.checkAndRecord("recruit:login", limit, windowSec, penaltySec);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.blockedUntil).toBeGreaterThan(0);

    // Move time forward but within penalty window => still blocked
    jest.setSystemTime(penaltySec * 1000 - 1000);
    const stillBlocked = await store.checkAndRecord("recruit:login", limit, windowSec, penaltySec);
    expect(stillBlocked.allowed).toBe(false);

    // After penalty expires, allow again and reset count window
    jest.setSystemTime(penaltySec * 1000 + 1000);
    const postPenalty = await store.checkAndRecord("recruit:login", limit, windowSec, penaltySec);
    expect(postPenalty.allowed).toBe(true);
  });

  it("expires counters after window and starts fresh", async () => {
    const redis = new FakeRedis();
    const store = new RedisAbuseGuardStore(redis as unknown as Redis);

    const limit = 2;
    const windowSec = 30;
    const penaltySec = 60;

    await store.checkAndRecord("route:x", limit, windowSec, penaltySec);
    await store.checkAndRecord("route:x", limit, windowSec, penaltySec);
    const blocked = await store.checkAndRecord("route:x", limit, windowSec, penaltySec);
    expect(blocked.allowed).toBe(false);

    // Advance beyond window and penalty so counters should reset
    jest.setSystemTime((windowSec + penaltySec + 1) * 1000);
    const fresh = await store.checkAndRecord("route:x", limit, windowSec, penaltySec);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(limit - 1);
  });
});
