import type {Request, Response, NextFunction} from "express";
import {db} from "../config/firebase";

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
      res.status(401).json({error: "Missing authorization token"});
      return;
    }

    // Validate token against recruitSessions collection
    const sessionSnap = await db.collection(SESSIONS_COLLECTION).doc(token).get();

    if (!sessionSnap.exists) {
      res.status(401).json({error: "Invalid or expired session"});
      return;
    }

    const sessionData = sessionSnap.data() as {email?: string};
    if (!sessionData?.email) {
      res.status(401).json({error: "Invalid session payload"});
      return;
    }

    // Attach session data to request
    // Note: Using 'any' cast to extend Request without modifying Express types
    (req as any).recruitSession = {
      token,
      email: sessionData.email,
    };

    next();
  } catch (error) {
    console.error("Recruit auth middleware error:", error);
    res.status(500).json({error: "Internal server error"});
  }
}
