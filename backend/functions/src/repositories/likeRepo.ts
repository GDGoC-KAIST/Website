import {db} from "../config/firebase";
import type {TargetType} from "../types/schema";
import type {DocumentReference} from "firebase-admin/firestore";

const TARGET_COLLECTIONS: Record<TargetType, string> = {
  post: "posts",
  project: "projects",
  seminar: "seminars",
};

const LIKE_COLLECTION = "likes";

export class LikeRepo {
  getLikeRef(docId: string): DocumentReference {
    return db.collection(LIKE_COLLECTION).doc(docId);
  }

  getTargetRef(type: TargetType, id: string): DocumentReference {
    const collection = TARGET_COLLECTIONS[type];
    return db.collection(collection).doc(id);
  }
}
