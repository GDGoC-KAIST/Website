import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import type {Gallery, NewGallery} from "../types/schema";

const GALLERIES_COLLECTION = "galleries";

export class GalleryRepo {
  private collection = db.collection(GALLERIES_COLLECTION);

  async createGallery(data: NewGallery): Promise<Gallery> {
    const now = Timestamp.now();
    const payload: Omit<Gallery, "id"> = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.collection.add(payload);
    return {id: docRef.id, ...payload};
  }

  async listGalleries(
    limit: number,
    cursor?: string
  ): Promise<{galleries: Gallery[]; nextCursor: string | null}> {
    let query: FirebaseFirestore.Query = this.collection.orderBy("createdAt", "desc");
    if (cursor) {
      query = query.startAfter(Timestamp.fromMillis(Number(cursor)));
    }
    const snapshot = await query.limit(limit).get();
    const galleries = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Gallery, "id">;
      return {id: doc.id, ...data};
    });
    const last = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = last ? String((last.data() as Gallery).createdAt.toMillis()) : null;
    return {galleries, nextCursor};
  }

  async findById(id: string): Promise<Gallery | null> {
    const snap = await this.collection.doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<Gallery, "id">;
    return {id: snap.id, ...data};
  }

  async updateGallery(id: string, data: Partial<Gallery>): Promise<void> {
    await this.collection.doc(id).set(
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  async deleteGallery(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
