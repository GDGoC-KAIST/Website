import {FieldValue, FieldPath, Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {AppError} from "../utils/appError";
import type {Comment, NewComment, TargetType} from "../types/schema";

const COMMENTS_COLLECTION = "comments";
const TARGET_COLLECTION_MAP: Record<TargetType, string> = {
  post: "posts",
  project: "projects",
  seminar: "seminars",
};

export interface CommentFilter {
  targetType: TargetType;
  targetId: string;
  parentId?: string;
}

export class CommentRepo {
  private collection = db.collection(COMMENTS_COLLECTION);

  async createComment(data: NewComment): Promise<Comment> {
    const targetCollection = TARGET_COLLECTION_MAP[data.targetType];
    const targetRef = db.collection(targetCollection).doc(data.targetId);
    const result = await db.runTransaction(async (tx) => {
      const now = Timestamp.now();
      const docRef = this.collection.doc();
      const record: Omit<Comment, "id"> = {
        ...data,
        parentId: data.parentId ?? null,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };
      tx.set(docRef, record);
      tx.update(targetRef, {
        commentCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {id: docRef.id, ...record};
    });
    return result;
  }

  async findById(id: string): Promise<Comment | null> {
    const snap = await this.collection.doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<Comment, "id">;
    return {id: snap.id, ...data};
  }

  async softDeleteComment(id: string, targetType: TargetType, targetId: string): Promise<void> {
    const targetCollection = TARGET_COLLECTION_MAP[targetType];
    const targetRef = db.collection(targetCollection).doc(targetId);
    await db.runTransaction(async (tx) => {
      const commentRef = this.collection.doc(id);
      const snapshot = await tx.get(commentRef);
      if (!snapshot.exists) {
        throw new AppError(404, "COMMENT_NOT_FOUND", "Comment not found");
      }
      const comment = snapshot.data() as Comment;
      if (comment.isDeleted) {
        return;
      }
      tx.update(commentRef, {
        isDeleted: true,
        content: "[Deleted]",
        updatedAt: Timestamp.now(),
      });

      const targetSnap = await tx.get(targetRef);
      if (!targetSnap.exists) {
        return;
      }
      const currentCount = Number(targetSnap.get("commentCount") ?? 0);
      const nextCount = Math.max(0, currentCount - 1);
      tx.update(targetRef, {
        commentCount: nextCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async listComments(
    filter: CommentFilter,
    limit: number,
    cursor?: string
  ): Promise<{comments: Comment[]; nextCursor: string | null}> {
    let query: FirebaseFirestore.Query = this.collection
      .where("targetType", "==", filter.targetType)
      .where("targetId", "==", filter.targetId)
      .where("isDeleted", "==", false);

    if (filter.parentId !== undefined) {
      query = query.where("parentId", "==", filter.parentId ?? null);
    }

    query = query.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");

    if (cursor) {
      const {timestamp, docId} = decodeCursor(cursor);
      query = query.startAfter(timestamp, docId);
    }

    const snapshot = await query.limit(limit).get();
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Comment, "id">;
      return {id: doc.id, ...data};
    });
    const last = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = last
      ? encodeCursor((last.data() as Comment).createdAt, last.id)
      : null;
    return {comments, nextCursor};
  }
}

function encodeCursor(createdAt: Timestamp, docId: string): string {
  return `${createdAt.toMillis()}_${docId}`;
}

function decodeCursor(cursor: string): {timestamp: Timestamp; docId: string} {
  const [ts, docId] = cursor.split("_");
  return {
    timestamp: Timestamp.fromMillis(Number(ts)),
    docId,
  };
}
