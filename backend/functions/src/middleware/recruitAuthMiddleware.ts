import type {Request, Response, NextFunction} from "express";
import type {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {AppError} from "../utils/appError";

const SESSIONS_COLLECTION = "recruitSessions";

/**
 * Middleware to authenticate recruit applicants using session tokens.
 * Validates Bearer token against recruitSessions collection.
 * Attaches session data to req object for downstream handlers.
 */
export async function recruitAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : "";

    if (!token) {
      throw AppError.unauthorized("Unauthorized");
    }

    // Validate token against recruitSessions collection
    const sessionSnap = await db.collection(SESSIONS_COLLECTION).doc(token).get();

    if (!sessionSnap.exists) {
      throw AppError.unauthorized("Unauthorized");
    }

    const sessionData = sessionSnap.data() as {
      email?: string;
      expiresAt?: Timestamp;
    };
    if (!sessionData?.email) {
      throw AppError.unauthorized("Unauthorized");
    }

    const expiresAt = sessionData.expiresAt;
    if (expiresAt && typeof expiresAt.toMillis === "function") {
      if (expiresAt.toMillis() < Date.now()) {
        try {
          await sessionSnap.ref.delete();
        } catch (error) {
          console.error("Failed to delete expired recruit session", {
            token,
            error,
          });
        }
        throw AppError.unauthorized("Unauthorized");
      }
    }

    // Attach session data to request
    // Note: Using 'any' cast to extend Request without modifying Express types
    (req as any).recruitSession = {
      token,
      email: sessionData.email,
    };

    next();
  } catch (error) {
    if (error instanceof AppError && error.statusCode < 500) {
      return next(error);
    }
    console.error("Recruit auth middleware error:", error);
    next(error);
  }
}
