import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import Redis from "ioredis";
import * as logger from "firebase-functions/logger";
import {bucket} from "../../config/firebase.ts";
import {env} from "../../config/env.ts";

type DependencyStatus = "up" | "down" | "skipped";

async function checkFirestore(): Promise<DependencyStatus> {
  try {
    await getFirestore().doc("health/ping").get();
    return "up";
  } catch (error) {
    logger.error("Firestore health check failed", {error});
    return "down";
  }
}

async function checkStorage(): Promise<DependencyStatus> {
  try {
    const [exists] = await bucket.exists();
    return exists ? "up" : "down";
  } catch (error) {
    logger.error("Storage health check failed", {error});
    return "down";
  }
}

function createRedisHealthClient(): Redis {
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
  const password = process.env.REDIS_PASSWORD;

  if (url) return new Redis(url, {lazyConnect: true});
  if (host) return new Redis({host, port, password, lazyConnect: true});

  throw new Error("Missing Redis configuration: set REDIS_URL or REDIS_HOST when ABUSE_GUARD_STORE=redis");
}

async function checkRedis(): Promise<DependencyStatus> {
  if (env.abuseGuardStore !== "redis") return "skipped";

  const client = createRedisHealthClient();
  try {
    await client.ping();
    return "up";
  } catch (error) {
    logger.error("Redis health check failed", {error});
    return "down";
  } finally {
    client.disconnect();
  }
}

export async function healthz(req: Request, res: Response): Promise<void> {
  const isDeepCheck = req.query.deep === "1";

  if (!isDeepCheck) {
    try {
      await getFirestore().collection("health_check").limit(1).get();
      res.status(200).json({
        ok: true,
        service: "functions",
        ts: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Health check failed", {error});
      res.status(503).json({error: "Service Unavailable"});
    }
    return;
  }

  const dependencies = {
    firestore: await checkFirestore(),
    storage: await checkStorage(),
    redis: await checkRedis(),
  } as const;

  const hasFailure = Object.values(dependencies).some((status) => status === "down");
  const payload = {
    ok: !hasFailure,
    service: "functions",
    ts: new Date().toISOString(),
    dependencies,
  };

  if (hasFailure) {
    res.status(503).json({...payload, error: "Dependency Failure"});
    return;
  }

  res.status(200).json(payload);
}
