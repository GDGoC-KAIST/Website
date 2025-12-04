import {db} from "../../config/firebase";
import type {MigrationContext, MigrationStats} from "../../services/migrationService";

export async function tiptapNormalizeMigration(ctx: MigrationContext): Promise<MigrationStats> {
  const stats: MigrationStats = {scanned: 0, updated: 0, skipped: 0};
  let batch = db.batch();
  let batchCount = 0;
  const snapshot = await db.collection("posts").limit(ctx.limit).get();

  for (const doc of snapshot.docs) {
    stats.scanned++;
    const data = doc.data() as Record<string, unknown>;
    if (typeof data.content === "string") {
      stats.updated++;
      if (!ctx.dryRun) {
        batch.set(
          doc.ref,
          {
            content: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: data.content,
                    },
                  ],
                },
              ],
            },
          },
          {merge: true}
        );
        batchCount++;
      }
    } else {
      stats.skipped++;
    }

    if (!ctx.dryRun && batchCount >= 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!ctx.dryRun && batchCount > 0) {
    await batch.commit();
  }

  return stats;
}
