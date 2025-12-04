import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {AppError} from "../utils/appError";
import type {Role} from "../types/auth";
import {tiptapNormalizeMigration} from "../repositories/migrations/tiptapNormalize";
import {tiptapDeriveFields} from "../repositories/migrations/tiptapDeriveFields";

const MAX_BATCH_SIZE = 400;

export interface MigrationOptions {
  dryRun?: boolean;
  limit?: number;
}

export interface MigrationReport {
  name: string;
  dryRun: boolean;
  scanned: number;
  updated: number;
  skipped: number;
}

interface AdminUser {
  sub: string;
  roles: Role[];
}

export interface MigrationContext {
  dryRun: boolean;
  limit: number;
}

export type MigrationHandler = (ctx: MigrationContext) => Promise<MigrationStats>;

export interface MigrationStats {
  scanned: number;
  updated: number;
  skipped: number;
}

export class MigrationService {
  private migrations: Record<string, MigrationHandler> = {
    timestampNormalize: this.timestampNormalize.bind(this),
    backfillCounters: this.backfillCounters.bind(this),
    backfillImageOwner: this.backfillImageOwner.bind(this),
    tiptapNormalize: tiptapNormalizeMigration,
    tiptapDeriveFields,
  };

  async run(
    user: AdminUser,
    name: string,
    options: MigrationOptions
  ): Promise<MigrationReport> {
    this.ensureAdmin(user);
    const migration = this.migrations[name];
    if (!migration) {
      throw new AppError(400, "INVALID_ARGUMENT", `Unknown migration "${name}"`);
    }
    const ctx: MigrationContext = {
      dryRun: options.dryRun ?? true,
      limit: options.limit && options.limit > 0 ? Math.min(options.limit, 500) : 100,
    };
    const stats = await migration(ctx);
    return {name, dryRun: ctx.dryRun, ...stats};
  }

  private ensureAdmin(user: AdminUser) {
    if (!user.roles.includes("ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Admin access required");
    }
  }

  private async timestampNormalize(ctx: MigrationContext): Promise<MigrationStats> {
    const stats = createStats();
    const batcher = new BatchWriter(ctx.dryRun);

    await this.runBatch("seminars", ctx.limit, async (doc) => {
      stats.scanned++;
      const data = doc.data() as Record<string, unknown>;
      const update: Record<string, Timestamp> = {};
      let changed = false;
      ["date", "createdAt"].forEach((field) => {
        const value = data[field];
        if (typeof value === "number") {
          update[field] = Timestamp.fromMillis(value);
          changed = true;
        }
      });
      if (changed) {
        stats.updated++;
        await batcher.set(doc.ref, update);
      } else {
        stats.skipped++;
      }
    });

    await batcher.flush();
    return stats;
  }

  private async backfillCounters(ctx: MigrationContext): Promise<MigrationStats> {
    const stats = createStats();
    const batcher = new BatchWriter(ctx.dryRun);
    const fields = ["likeCount", "commentCount"];

    for (const collection of ["projects", "seminars"]) {
      await this.runBatch(collection, ctx.limit, async (doc) => {
        stats.scanned++;
        const data = doc.data() as Record<string, unknown>;
        const update: Record<string, number> = {};
        let changed = false;

        fields.forEach((field) => {
          const value = data[field];
          if (value === undefined || value === null) {
            update[field] = 0;
            changed = true;
          }
        });

        if (changed) {
          stats.updated++;
          await batcher.set(doc.ref, update);
        } else {
          stats.skipped++;
        }
      });
    }

    await batcher.flush();
    return stats;
  }

  private async backfillImageOwner(ctx: MigrationContext): Promise<MigrationStats> {
    const stats = createStats();
    const batcher = new BatchWriter(ctx.dryRun);

    await this.runBatch("images", ctx.limit, async (doc) => {
      stats.scanned++;
      const data = doc.data() as Record<string, unknown>;
      if (!data.uploaderUserId) {
        stats.updated++;
        await batcher.set(doc.ref, {uploaderUserId: "SYSTEM"});
      } else {
        stats.skipped++;
      }
    });

    await batcher.flush();
    return stats;
  }

  private async runBatch(
    collection: string,
    limit: number,
    handler: (doc: FirebaseFirestore.QueryDocumentSnapshot) => Promise<void>
  ) {
    const snapshot = await db.collection(collection).limit(limit).get();
    for (const doc of snapshot.docs) {
      await handler(doc);
    }
  }
}

class BatchWriter {
  private batch = db.batch();
  private count = 0;

  constructor(private readonly dryRun: boolean) {}

  async set(
    ref: FirebaseFirestore.DocumentReference,
    data: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>
  ) {
    if (this.dryRun) return;
    this.batch.set(ref, data, {merge: true});
    this.count++;
    if (this.count >= MAX_BATCH_SIZE) {
      await this.commit();
    }
  }

  async flush() {
    if (this.dryRun) return;
    if (this.count === 0) return;
    await this.batch.commit();
    this.batch = db.batch();
    this.count = 0;
  }

  private async commit() {
    if (this.dryRun || this.count === 0) return;
    await this.batch.commit();
    this.batch = db.batch();
    this.count = 0;
  }
}

function createStats(): MigrationStats {
  return {scanned: 0, updated: 0, skipped: 0};
}
