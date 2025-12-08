import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import http from "node:http";
import firebaseFunctionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";
import jwt from "jsonwebtoken";
import type {Role} from "../../src/types/auth";

const workspaceRoot = process.cwd();
const repoRoot = path.resolve(workspaceRoot, "..");
const emulatorEnvPath = path.join(repoRoot, ".tmp", "emulators.env");

if (!fs.existsSync(emulatorEnvPath)) {
  throw new Error(`Missing emulator env file at ${emulatorEnvPath}. Run pick-ports before tests.`);
}

dotenv.config({path: emulatorEnvPath, override: true});
const localEnvPath = path.resolve(workspaceRoot, ".env.test");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({path: localEnvPath, override: false});
}
dotenv.config({path: path.resolve(workspaceRoot, ".env"), override: false});

// Set storage emulator host before importing firebase config
process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:9199";

import "../../src/config/firebase";

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "demo-test";
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;

if (!FIRESTORE_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FUNCTIONS_EMULATOR_HOST) {
  throw new Error("Emulator hosts are not configured. Ensure pick-ports.mjs has run.");
}

const FIRESTORE_RESET_PATH = `/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const [firestoreHostName, firestorePortRaw] = FIRESTORE_HOST.split(":");
const FIRESTORE_PORT = Number(firestorePortRaw ?? "8080");

const testEnv = firebaseFunctionsTest({projectId: PROJECT_ID});

export async function setupTestEnv(): Promise<void> {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
  process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret";
  process.env.LINK_CODE_SECRET = process.env.LINK_CODE_SECRET || "test-link-secret";
  process.env.IP_HASH_SALT = process.env.IP_HASH_SALT || "test-ip-hash-salt";
  process.env.ABUSE_GUARD_STORE = process.env.ABUSE_GUARD_STORE || "firestore";
  process.env.TRUST_PROXY_HOPS = process.env.TRUST_PROXY_HOPS || "1";
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? "test-aws-key";
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ?? "test-aws-secret";
  process.env.SES_REGION = process.env.SES_REGION ?? "ap-northeast-2";

  if (!admin.apps.length) {
    admin.initializeApp({projectId: PROJECT_ID});
  }
}

export async function teardownTestEnv(): Promise<void> {
  await clearFirestore();
  await Promise.resolve(testEnv.cleanup());
  await Promise.all(admin.apps.map((app) => app?.delete()));
}

async function purgeFirestore(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = http.request(
      {
        method: "DELETE",
        host: firestoreHostName || "127.0.0.1",
        port: FIRESTORE_PORT,
        path: FIRESTORE_RESET_PATH,
        agent: false,
        headers: {
          Connection: "close",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(
              new Error(
                `Failed to clear Firestore emulator: ${res.statusCode ?? "unknown"} ${Buffer.concat(chunks).toString()}`
              )
            );
          }
        });
        res.resume();
      }
    );
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error("Firestore purge timed out"));
    });
    req.end();
  });
}

export async function clearFirestore(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await purgeFirestore();
      return;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      // Brief backoff to avoid flaky emulator socket resets between tests
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }
}

export function createAuthHeaders(userId: string, roles: Role[] = ["USER"]): Record<string, string> {
  const secret = process.env.JWT_SECRET || "test-jwt-secret";
  const token = jwt.sign(
    {
      sub: userId,
      roles,
    },
    secret,
    {expiresIn: "1h"}
  );
  return {Authorization: `Bearer ${token}`};
}
