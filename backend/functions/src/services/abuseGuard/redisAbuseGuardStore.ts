import Redis from "ioredis";
import * as logger from "firebase-functions/logger";
import type {AbuseGuardStore, CheckResult} from "./types";

type RedisCommands = Pick<Redis, "get" | "ttl" | "incr" | "expire" | "setex">;

function createRedisClient(): RedisCommands {
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
  const password = process.env.REDIS_PASSWORD;

  if (url) {
    return new Redis(url, {lazyConnect: true});
  }

  if (!host) {
    throw new Error("Missing Redis configuration: set REDIS_URL or REDIS_HOST when ABUSE_GUARD_STORE=redis");
  }

  return new Redis({host, port, password, lazyConnect: true});
}

export class RedisAbuseGuardStore implements AbuseGuardStore {
  private readonly client: RedisCommands;

  constructor(client: RedisCommands = createRedisClient()) {
    this.client = client;
  }

  async checkAndRecord(key: string, limit: number, windowSec: number, penaltySec: number): Promise<CheckResult> {
    const blockKey = `abuse:block:${key}`;
    const countKey = `abuse:count:${key}`;
    const now = Date.now();

    try {
      const blockTtl = await this.client.ttl(blockKey);
      if (blockTtl > 0) {
        return {allowed: false, blockedUntil: now + blockTtl * 1000, remaining: 0};
      }

      const count = await this.client.incr(countKey);
      const countTtl = await this.client.ttl(countKey);
      if (count === 1 || countTtl < 0) {
        await this.client.expire(countKey, windowSec);
      }

      if (count > limit) {
        await this.client.setex(blockKey, penaltySec, "1");
        await this.client.expire(countKey, windowSec);
        return {allowed: false, blockedUntil: now + penaltySec * 1000, remaining: 0};
      }

      return {allowed: true, remaining: Math.max(0, limit - count)};
    } catch (error) {
      logger.error("Redis abuse guard error", {error, key});
      // Fail-open to keep API available if Redis is unavailable
      return {allowed: true, remaining: limit};
    }
  }
}
