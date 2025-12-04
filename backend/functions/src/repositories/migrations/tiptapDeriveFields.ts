import {db} from "../../config/firebase";
import type {MigrationContext, MigrationStats} from "../../services/migrationService";
import {extractPlainText, generateExcerpt, calculateReadingTime} from "../../utils/tiptapUtils";

export async function tiptapDeriveFields(ctx: MigrationContext): Promise<MigrationStats> {
  const stats: MigrationStats = {scanned: 0, updated: 0, skipped: 0};
  let batch = db.batch();
  let batchCount = 0;
  const snapshot = await db.collection("posts").limit(ctx.limit).get();

  for (const doc of snapshot.docs) {
    stats.scanned++;
    const data = doc.data() as Record<string, unknown>;
    const content = data.content;
    let plainText: string | null = null;
    let excerpt: string | null = null;
    let readingTime: number | null = null;

    if (typeof content === "string") {
      plainText = content;
      excerpt = plainText.length > 300 ? `${plainText.slice(0, 300)}…` : plainText;
      readingTime = calculateReadingTime(plainText);
    } else if (content && typeof content === "object") {
      try {
        plainText = extractPlainText(content as any);
        excerpt = generateExcerpt(content as any);
        readingTime = calculateReadingTime(plainText);
      } catch {
        stats.skipped++;
        continue;
      }
    } else {
      stats.skipped++;
      continue;
    }

    stats.updated++;
    if (!ctx.dryRun) {
      batch.set(
        doc.ref,
        {
          plainText,
          excerpt,
          readingTime,
        },
        {merge: true}
      );
      batchCount++;
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
