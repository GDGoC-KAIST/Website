import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import type {
  RecruitApplication,
  RecruitApplicationStatus,
  RecruitConfig,
} from "../types/schema";
import {AppError} from "../utils/appError";

const CONFIG_COLLECTION = "recruitConfig";
const CONFIG_DOC_ID = "current";
const APPLICATIONS_COLLECTION = "recruitApplications";

export interface ApplicationFilter {
  status?: RecruitApplicationStatus;
}

export class RecruitRepo {
  private configRef = db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID);
  private applications = db.collection(APPLICATIONS_COLLECTION);

  async getConfig(): Promise<RecruitConfig> {
    const snap = await this.configRef.get();
    if (!snap.exists) {
      throw new AppError(404, "RECRUIT_CONFIG_NOT_FOUND", "Recruit config not found");
    }
    return snap.data() as RecruitConfig;
  }

  async updateConfig(data: Partial<RecruitConfig>): Promise<void> {
    await this.configRef.set(
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  async listApplications(
    filter: ApplicationFilter,
    limit: number,
    cursor?: string
  ): Promise<{applications: RecruitApplication[]; nextCursor: string | null}> {
    let query: FirebaseFirestore.Query = this.applications.orderBy("createdAt", "desc");
    if (filter.status) {
      query = query.where("status", "==", filter.status);
    }
    if (cursor) {
      query = query.startAfter(Timestamp.fromMillis(Number(cursor)));
    }
    const snapshot = await query.limit(limit).get();
    const applications = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<RecruitApplication, "id">;
      return {id: doc.id, ...data};
    });
    const last = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = last
      ? String((last.data() as RecruitApplication).createdAt.toMillis())
      : null;
    return {applications, nextCursor};
  }

  async getApplication(id: string): Promise<RecruitApplication | null> {
    const snap = await this.applications.doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<RecruitApplication, "id">;
    return {id: snap.id, ...data};
  }

  async updateStatus(
    id: string,
    status: RecruitApplicationStatus,
    meta: Partial<RecruitApplication>
  ): Promise<void> {
    await this.applications.doc(id).set(
      {
        status,
        ...meta,
        statusUpdatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  applicationRef(id: string) {
    return this.applications.doc(id);
  }

  configRefDoc() {
    return this.configRef;
  }
}
