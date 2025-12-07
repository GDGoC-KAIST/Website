import type {Request, Response} from "express";
import * as crypto from "crypto";
import * as logger from "firebase-functions/logger";
import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {RecruitApplication} from "../types/recruit";
import {hashPassword, comparePassword} from "../utils/security";
import {enqueueOutboxMessage} from "../outbox/recruitOutbox";
import {setCorsHeaders} from "../utils/cors";
import {normalizeEmail, assertApplicationOpen} from "../utils/recruitHelpers";
import {readRecruitConfig, serializeRecruitConfig} from "../utils/recruitConfig";

const APPLICATIONS = "recruitApplications";
const SESSIONS = "recruitSessions";
const MAX_FAILED_ATTEMPTS = 10;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function withCors(
  request: Request,
  response: Response
): boolean {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
}

function handleControllerError(
  response: Response,
  error: unknown,
  defaultStatus = 500
): void {
  const status = (error as {status?: number})?.status ?? defaultStatus;
  const message = error instanceof Error ? error.message : "Unknown error";
  // Only log server errors (5xx), not client errors (4xx)
  if (status >= 500) {
    logger.error("Recruit controller error", {message, error, status});
  }
  response.status(status).json({error: message});
}

function generateTempPassword(length = 12): string {
  let output = "";
  while (output.length < length) {
    output += crypto.randomBytes(8).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  }
  return output.slice(0, length);
}

async function createSession(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await db.collection(SESSIONS).doc(token).set({
    email,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

async function resolveSession(request: Request): Promise<{token: string; email: string}> {
  const authHeader = request.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";
  if (!token) {
    const error = new Error("Missing authorization token");
    (error as Error & {status?: number}).status = 401;
    throw error;
  }

  const sessionSnap = await db.collection(SESSIONS).doc(token).get();
  if (!sessionSnap.exists) {
    const error = new Error("Invalid or expired session");
    (error as Error & {status?: number}).status = 401;
    throw error;
  }

  const sessionData = sessionSnap.data() as {email?: string};
  if (!sessionData?.email) {
    const error = new Error("Invalid session payload");
    (error as Error & {status?: number}).status = 401;
    throw error;
  }

  return {token, email: sessionData.email};
}

async function loadApplication(email: string): Promise<RecruitApplication | null> {
  const snap = await db.collection(APPLICATIONS).doc(email).get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as RecruitApplication;
}

async function queueConfirmationEmail(to: string, name: string): Promise<void> {
  await enqueueOutboxMessage("recruit.applicationReceived", to, {
    subject: "[GDGoC KAIST] Application received",
    html: `
      <p>Hi ${name},</p>
      <p>We successfully received your GDGoC KAIST recruiting application.</p>
      <p>We will reach out via email once the review process is complete.</p>
    `,
  });
}

async function queueTempPasswordEmail(
  to: string,
  tempPassword: string
): Promise<void> {
  await enqueueOutboxMessage("recruit.temporaryPassword", to, {
    subject: "[GDGoC KAIST] Temporary password",
    html: `
      <p>Too many unsuccessful login attempts have locked your recruiting account.</p>
      <p>Use the temporary password below after the 15 minute lock period to sign in:</p>
      <p><strong>${tempPassword}</strong></p>
      <p>Please change it immediately after logging in.</p>
    `,
  });
}

export async function recruitApplyHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (withCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const config = await readRecruitConfig();
    assertApplicationOpen(config);

    const {
      name,
      kaistEmail,
      googleEmail,
      phone,
      department,
      studentId,
      motivation,
      experience,
      wantsToDo,
      githubUsername,
      portfolioUrl,
      password,
    } = request.body ?? {};

    const requiredFields = {
      name,
      kaistEmail,
      googleEmail,
      phone,
      department,
      studentId,
      motivation,
      experience,
      wantsToDo,
      password,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || typeof value !== "string" || !value.trim()) {
        response.status(400).json({error: `Missing required field: ${key}`});
        return;
      }
    }

    const normalizedEmail = normalizeEmail(kaistEmail);
    const docRef = db.collection(APPLICATIONS).doc(normalizedEmail);
    const existing = await docRef.get();
    if (existing.exists) {
      response.status(409).json({error: "Application already exists"});
      return;
    }

    const hashedPassword = await hashPassword(password);
    const now = Timestamp.now();

    const application: RecruitApplication = {
      id: normalizedEmail,
      name: name.trim(),
      kaistEmail: normalizedEmail,
      googleEmail: googleEmail.trim(),
      phone: phone.trim(),
      department: department.trim(),
      studentId: studentId.trim(),
      motivation,
      experience,
      wantsToDo,
      githubUsername: githubUsername?.trim() || undefined,
      portfolioUrl: portfolioUrl?.trim() || undefined,
      passwordHash: hashedPassword,
      failedAttempts: 0,
      lockedUntil: null,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(application);

    const confirmationTarget = application.googleEmail || application.kaistEmail;
    await queueConfirmationEmail(confirmationTarget, application.name);

    response.status(201).json({success: true});
    console.info("Recruit Apply Attempt", {
      outcome: "success",
      ipHash: request.telemetry?.ipHash,
      uaSummary: request.telemetry?.uaSummary,
    });
  } catch (error) {
    console.warn("Recruit Apply Failed", {
      outcome: "error",
      ipHash: request.telemetry?.ipHash,
      uaSummary: request.telemetry?.uaSummary,
      message: error instanceof Error ? error.message : String(error),
    });
    handleControllerError(response, error);
  }
}

export async function recruitLoginHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (withCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {kaistEmail, password} = request.body ?? {};
    if (!kaistEmail || !password) {
      response.status(400).json({error: "kaistEmail and password are required"});
      return;
    }

    const normalizedEmail = normalizeEmail(kaistEmail);
    const application = await loadApplication(normalizedEmail);

    if (!application) {
      response.status(401).json({error: "Invalid credentials"});
      return;
    }

    if (application.lockedUntil && application.lockedUntil.toMillis() > Date.now()) {
      response.status(423).json({
        error: "Account locked due to failed attempts. Try again later.",
      });
      return;
    }

    const matches = await comparePassword(password, application.passwordHash);
    const docRef = db.collection(APPLICATIONS).doc(normalizedEmail);
    const now = Timestamp.now();

    if (matches) {
      await docRef.update({
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: now,
      });

      const token = await createSession(normalizedEmail);
      response.status(200).json({success: true, token});
      console.info("Recruit Login Attempt", {
        outcome: "success",
        ipHash: request.telemetry?.ipHash,
        uaSummary: request.telemetry?.uaSummary,
      });
      return;
    }

    let failedAttempts = (application.failedAttempts || 0) + 1;
    const updates: Record<string, unknown> = {
      failedAttempts,
      updatedAt: now,
    };

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = Timestamp.fromMillis(
        Date.now() + LOCK_DURATION_MS
      );
      const tempPassword = generateTempPassword();
      const hashedTemp = await hashPassword(tempPassword);

      updates.failedAttempts = 0;
      updates.lockedUntil = lockedUntil;
      updates.passwordHash = hashedTemp;

      await docRef.update(updates);

      await queueTempPasswordEmail(
        application.googleEmail || application.kaistEmail,
        tempPassword
      );

      response.status(423).json({
        error: "Account locked after too many failed attempts. Check your email.",
      });
      console.warn("Recruit Login Failed", {
        outcome: "locked",
        ipHash: request.telemetry?.ipHash,
        uaSummary: request.telemetry?.uaSummary,
      });
      return;
    }

    await docRef.update(updates);
    response.status(401).json({error: "Invalid credentials"});
    console.warn("Recruit Login Failed", {
      outcome: "invalid_credentials",
      ipHash: request.telemetry?.ipHash,
      uaSummary: request.telemetry?.uaSummary,
    });
  } catch (error) {
    console.error("Recruit Login Error", {
      outcome: "error",
      ipHash: request.telemetry?.ipHash,
      uaSummary: request.telemetry?.uaSummary,
      message: error instanceof Error ? error.message : String(error),
    });
    handleControllerError(response, error);
  }
}

export async function recruitUpdateHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (withCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {token, email} = await resolveSession(request);

    const config = await readRecruitConfig();
    assertApplicationOpen(config);

    const allowedFields = [
      "name",
      "googleEmail",
      "phone",
      "department",
      "studentId",
      "motivation",
      "experience",
      "wantsToDo",
      "githubUsername",
      "portfolioUrl",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (request.body?.[field] !== undefined) {
        updates[field] = request.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      response.status(400).json({error: "No updatable fields provided"});
      return;
    }

    updates.updatedAt = Timestamp.now();

    await db.collection(APPLICATIONS).doc(email).update(updates);
    await db.collection(SESSIONS).doc(token).update({
      updatedAt: Timestamp.now(),
    });

    response.status(200).json({success: true});
  } catch (error) {
    handleControllerError(response, error);
  }
}

export async function recruitResetHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (withCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  const {kaistEmail} = request.body ?? {};
  if (!kaistEmail) {
    response.status(400).json({error: "kaistEmail is required"});
    return;
  }

  try {
    const normalizedEmail = normalizeEmail(kaistEmail);
    const docRef = db.collection(APPLICATIONS).doc(normalizedEmail);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data() as RecruitApplication;
      const tempPassword = generateTempPassword();
      const hashedTemp = await hashPassword(tempPassword);

      await docRef.update({
        passwordHash: hashedTemp,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: Timestamp.now(),
      });

      await queueTempPasswordEmail(
        data.googleEmail || data.kaistEmail,
        tempPassword
      );
    }

    response.status(200).json({success: true});
  } catch (error) {
    handleControllerError(response, error);
  }
}

export async function recruitConfigHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (withCors(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const config = await readRecruitConfig();
    response.status(200).json(serializeRecruitConfig(config));
  } catch (error) {
    handleControllerError(response, error);
  }
}

export async function recruitMeHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (withCors(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {token, email} = await resolveSession(request);
    const doc = await db.collection(APPLICATIONS).doc(email).get();
    if (!doc.exists) {
      response.status(404).json({error: "Application not found"});
      return;
    }

    const data = doc.data() as RecruitApplication;
    const {passwordHash, failedAttempts, ...safe} = data;
    await db.collection(SESSIONS).doc(token).update({
      updatedAt: Timestamp.now(),
    });
    response.status(200).json(safe);
  } catch (error) {
    handleControllerError(response, error);
  }
}
