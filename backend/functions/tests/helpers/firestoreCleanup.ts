import {db} from "../../src/config/firebase";

const BATCH_LIMIT = 400;

export async function clearCollections(collectionNames: string[]): Promise<void> {
  for (const name of collectionNames) {
    const snapshot = await db.collection(name).get();
    if (snapshot.empty) continue;

    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      const slice = snapshot.docs.slice(i, i + BATCH_LIMIT);
      slice.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }
}
