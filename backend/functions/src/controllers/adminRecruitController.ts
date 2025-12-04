import type {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {Timestamp} from "firebase-admin/firestore";
import {Parser as Json2CsvParser} from "json2csv";
import {db} from "../config/firebase";
import {AdminService} from "../services/adminService";
import {RecruitApplication, RecruitStatus} from "../types/recruit";
import {setCorsHeaders} from "../utils/cors";
import {sendEmail} from "../utils/email";
import {
  readRecruitConfig,
  serializeRecruitConfig,
  updateRecruitConfig,
} from "../utils/recruitConfig";

const APPLICATIONS = "recruitApplications";
const adminService = new AdminService();
type StatusFilter = RecruitStatus | undefined;

const ALLOWED_STATUSES: RecruitStatus[] = [
  "submitted",
  "reviewing",
  "accepted",
  "rejected",
  "hold",
];

function handleCors(request: Request, response: Response): boolean {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
}

async function assertAdmin(adminId?: string): Promise<void> {
  if (!adminId) {
    const error = new Error("adminId is required");
    (error as Error & {status?: number}).status = 401;
    throw error;
  }

  const isAdmin = await adminService.isAdmin(adminId);
  if (!isAdmin) {
    const error = new Error("Unauthorized: Admin access required");
    (error as Error & {status?: number}).status = 403;
    throw error;
  }
}

function scrubApplication(data: RecruitApplication): Omit<
RecruitApplication,
"passwordHash" | "failedAttempts"
> & {passwordHash?: never; failedAttempts?: never} {
  const {passwordHash, failedAttempts, ...rest} = data;
  return rest;
}

function substituteTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    const replacement = variables[key];
    return replacement !== undefined ? replacement : "";
  });
}

async function fetchApplications(
  status: StatusFilter,
  limit: number,
  offset: number
): Promise<{applications: RecruitApplication[]; total: number}> {
  let baseQuery: FirebaseFirestore.Query = db.collection(APPLICATIONS);
  if (status) {
    baseQuery = baseQuery.where("status", "==", status);
  }

  const totalSnap = await baseQuery.count().get();
  const listSnap = await baseQuery
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .get();

  const applications = listSnap.docs.map((doc) => doc.data() as RecruitApplication);
  return {applications, total: totalSnap.data().count};
}

export async function adminGetApplicationsHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (handleCors(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  const adminId = request.query.adminId as string | undefined;

  try {
    await assertAdmin(adminId);

    const limit = Math.min(parseInt(request.query.limit as string, 10) || 20, 100);
    const offset = Math.max(parseInt(request.query.offset as string, 10) || 0, 0);
    const status = request.query.status as StatusFilter;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      response.status(400).json({error: "Invalid status filter"});
      return;
    }

    const {applications, total} = await fetchApplications(status, limit, offset);
    const safeApplications = applications.map((app) => scrubApplication(app));

    response.status(200).json({applications: safeApplications, total});
  } catch (error) {
    const status = (error as {status?: number}).status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to get recruit applications", {error: message});
    response.status(status).json({error: message});
  }
}

export async function adminUpdateApplicationStatusHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (handleCors(request, response)) return;

  if (request.method !== "PATCH") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {adminId, status, notify, email} = request.body ?? {};
    const applicationId =
      (request.query.id as string) || (request.body?.id as string) || request.path.split("/").pop();

    await assertAdmin(adminId);

    if (!applicationId) {
      response.status(400).json({error: "Application ID is required"});
      return;
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      response.status(400).json({error: "Invalid status value"});
      return;
    }

    if (notify && (!email?.subject || !email?.html)) {
      response.status(400).json({error: "Email subject and html are required when notify is true"});
      return;
    }

    const docRef = db.collection(APPLICATIONS).doc(applicationId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      response.status(404).json({error: "Application not found"});
      return;
    }

    const data = snapshot.data() as RecruitApplication;
    const now = Timestamp.now();

    await docRef.update({
      status,
      updatedAt: now,
    });

    let emailSent = false;
    let warning: string | undefined;

    if (notify && (status === "accepted" || status === "rejected")) {
      const targetEmail = data.googleEmail || data.kaistEmail;

      try {
        const html = substituteTemplate(email.html, {
          name: data.name || "",
          status,
        });

        await sendEmail({
          to: targetEmail,
          subject: email.subject,
          html,
        });

        emailSent = true;
        await docRef.update({
          decisionEmailSentAt: now,
        });
      } catch (err) {
        warning = err instanceof Error ? err.message : "Failed to send email";
        logger.error("Failed to send recruit decision email", {error: warning});
      }
    }

    response.status(200).json({success: true, emailSent, warning});
  } catch (error) {
    const status = (error as {status?: number}).status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    response.status(status).json({error: message});
  }
}

export async function adminExportApplicationsHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (handleCors(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  const adminId = request.query.adminId as string | undefined;

  try {
    await assertAdmin(adminId);

    const snapshot = await db
      .collection(APPLICATIONS)
      .orderBy("createdAt", "desc")
      .get();

    const rows = snapshot.docs.map((doc) => {
      const data = doc.data() as RecruitApplication;
      return {
        name: data.name,
        kaistEmail: data.kaistEmail,
        phone: data.phone,
        department: data.department,
        studentId: data.studentId,
        status: data.status,
        motivation: data.motivation,
        experience: data.experience,
        wantsToDo: data.wantsToDo,
        githubUsername: data.githubUsername || "",
        createdAt: data.createdAt?.toDate().toISOString() || "",
      };
    });

    const parser = new Json2CsvParser({
      fields: [
        "name",
        "kaistEmail",
        "phone",
        "department",
        "studentId",
        "status",
        "motivation",
        "experience",
        "wantsToDo",
        "githubUsername",
        "createdAt",
      ],
    });
    const csv = parser.parse(rows);

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=recruit_data.csv");
    response.status(200).send("\uFEFF" + csv);
  } catch (error) {
    const status = (error as {status?: number}).status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    response.status(status).json({error: message});
  }
}

export async function adminGetRecruitConfigHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (handleCors(request, response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  const adminId = request.query.adminId as string | undefined;

  try {
    await assertAdmin(adminId);
    const config = await readRecruitConfig();
    response.status(200).json(serializeRecruitConfig(config));
  } catch (error) {
    const status = (error as {status?: number}).status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    response.status(status).json({error: message});
  }
}

export async function adminUpdateRecruitConfigHandler(
  request: Request,
  response: Response
): Promise<void> {
  if (handleCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  const {adminId, isOpen, openAt, closeAt, messageWhenClosed, semester} = request.body ?? {};

  try {
    await assertAdmin(adminId);
    const updated = await updateRecruitConfig({
      isOpen,
      openAt,
      closeAt,
      messageWhenClosed,
      semester,
    });
    response.status(200).json({success: true, config: serializeRecruitConfig(updated)});
  } catch (error) {
    const status = (error as {status?: number}).status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    response.status(status).json({error: message});
  }
}
