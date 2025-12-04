import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {Image, ImageScope, NewImage} from "../types/schema";

const IMAGES_COLLECTION = "images";

export interface ImageFilter {
  uploaderUserId?: string;
  scopes: ImageScope[];
}

export class ImageRepo {
  private collection = db.collection(IMAGES_COLLECTION);

  async createImage(data: NewImage): Promise<Image> {
    const docRef = await this.collection.add(data);
    const snapshot = await docRef.get();
    const stored = snapshot.data() as Omit<Image, "id">;
    return {id: docRef.id, ...stored};
  }

  async updateImage(id: string, data: Partial<Image>): Promise<void> {
    await this.collection.doc(id).set(
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  async deleteImageDoc(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async findById(id: string): Promise<Image | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const stored = doc.data() as Omit<Image, "id">;
    return {id: doc.id, ...stored};
  }

  async listImages(
    filter: ImageFilter,
    limit: number,
    cursor?: string
  ): Promise<{images: Image[]; nextCursor: string | null}> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filter.uploaderUserId) {
      query = query.where("uploaderUserId", "==", filter.uploaderUserId);
    }

    if (filter.scopes.length === 1) {
      query = query.where("scope", "==", filter.scopes[0]);
    } else if (filter.scopes.length > 1) {
      query = query.where("scope", "in", filter.scopes);
    }

    if (cursor) {
      query = query.orderBy("createdAt", "desc").startAfter(Timestamp.fromMillis(Number(cursor)));
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    const snapshot = await query.limit(limit).get();
    const images = snapshot.docs.map((doc) => {
      const stored = doc.data() as Omit<Image, "id">;
      return {id: doc.id, ...stored};
    });
    const last = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = last
      ? String((last.data() as Omit<Image, "id">).createdAt.toMillis())
      : null;
    return {images, nextCursor};
  }
}
