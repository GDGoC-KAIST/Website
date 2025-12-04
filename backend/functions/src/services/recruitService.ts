import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {RecruitRepo, ApplicationFilter} from "../repositories/recruitRepo";
import {AppError} from "../utils/appError";
import type {
  RecruitApplication,
  RecruitApplicationStatus,
  RecruitConfig,
} from "../types/schema";
import type {Role} from "../types/auth";
import {generateLinkCode, hashLinkCode} from "../utils/hash";
import {MEMBERS_COLLECTION, MemberData} from "../types/member";

const APPLICATIONS_COLLECTION = "recruitApplications";
const LINK_EXPIRY_DAYS = 7;

export interface UserContext {
  sub: string;
  roles: Role[];
}

export interface UpdateConfigDto extends Partial<RecruitConfig> {}

export interface UpdateApplicationStatusDto {
  status: RecruitApplicationStatus;
  generation?: number;
}

export class RecruitService {
  private repo = new RecruitRepo();

  async getConfig(user: UserContext): Promise<RecruitConfig> {
    this.ensureAdmin(user);
    return this.repo.getConfig();
  }

  async updateConfig(user: UserContext, body: UpdateConfigDto): Promise<void> {
    this.ensureAdmin(user);
    if (body.targetSemester !== undefined && !body.targetSemester.trim()) {
      throw new AppError(400, "INVALID_ARGUMENT", "targetSemester cannot be empty");
    }
    if (body.noticeBody !== undefined && !body.noticeBody.trim()) {
      throw new AppError(400, "INVALID_ARGUMENT", "noticeBody cannot be empty");
    }
    await this.repo.updateConfig(body);
  }

  async listApplications(
    user: UserContext,
    filter: ApplicationFilter,
    limit?: number,
    cursor?: string
  ) {
    this.ensureAdmin(user);
    const size = limit && limit > 0 ? Math.min(limit, 100) : 20;
    return this.repo.listApplications(filter, size, cursor);
  }

  async updateApplicationStatus(
    user: UserContext,
    appId: string,
    body: UpdateApplicationStatusDto
  ): Promise<{ok: true; memberId?: string; linkCode?: string | null}> {
    this.ensureAdmin(user);
    this.validateStatus(body.status);
    if (body.status === "accepted") {
      const result = await this.acceptApplication(user, appId, body);
      return {ok: true, ...result};
    }

    await this.repo.updateStatus(appId, body.status, {
      statusUpdatedByUserId: user.sub,
    });
    return {ok: true};
  }

  private async acceptApplication(
    user: UserContext,
    appId: string,
    body: UpdateApplicationStatusDto
  ): Promise<{memberId?: string; linkCode?: string | null}> {
    if (!body.generation || body.generation <= 0) {
      throw new AppError(400, "INVALID_ARGUMENT", "generation is required for acceptance");
    }

    const result = await db.runTransaction(async (tx) => {
      const appRef = db.collection(APPLICATIONS_COLLECTION).doc(appId);
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        throw new AppError(404, "APPLICATION_NOT_FOUND", "Application not found");
      }
      const application = appSnap.data() as RecruitApplication;

      if (application.acceptedMemberId) {
        return {memberId: application.acceptedMemberId, linkCode: null};
      }

      const memberRef = db.collection(MEMBERS_COLLECTION).doc();
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );
      const linkCode = generateLinkCode();
      const linkHash = hashLinkCode(linkCode);

      const memberData: MemberData = {
        name: application.name,
        email: application.email,
        studentId: application.studentId,
        department: application.department,
        generation: body.generation,
        role: "Member",
        linkCodeHash: linkHash,
        linkCodeExpiresAt: expiresAt,
        linkCodeUsedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      tx.set(memberRef, memberData);
      tx.update(appRef, {
        status: "accepted",
        statusUpdatedAt: now,
        statusUpdatedByUserId: user.sub,
        acceptedMemberId: memberRef.id,
      });

      return {memberId: memberRef.id, linkCode};
    });

    return result;
  }

  private ensureAdmin(user: UserContext) {
    if (!user.roles.includes("ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Admin access required");
    }
  }

  private validateStatus(status: string) {
    const allowed: RecruitApplicationStatus[] = [
      "pending",
      "reviewing",
      "accepted",
      "rejected",
      "waitlist",
    ];
    if (!allowed.includes(status as RecruitApplicationStatus)) {
      throw new AppError(400, "INVALID_ARGUMENT", "Invalid status value");
    }
  }
}
