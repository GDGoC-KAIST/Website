import {Timestamp, FieldValue} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {LikeRepo} from "../repositories/likeRepo";
import {AppError} from "../utils/appError";
import type {TargetType} from "../types/schema";
import {Post} from "../types/post";

interface ToggleLikeDto {
  targetType: TargetType;
  targetId: string;
}

interface UserContext {
  sub: string;
  roles: string[];
}

export class LikeService {
  private repo = new LikeRepo();

  async toggleLike(
    user: UserContext,
    body: ToggleLikeDto
  ): Promise<{liked: boolean; likeCount: number}> {
    const targetType = this.normalizeTargetType(body.targetType);
    if (!body.targetId) {
      throw new AppError(400, "INVALID_ARGUMENT", "targetId is required");
    }
    const docId = this.buildLikeId(targetType, body.targetId, user.sub);
    const likeRef = this.repo.getLikeRef(docId);
    const targetRef = this.repo.getTargetRef(targetType, body.targetId);

    const result = await db.runTransaction(async (tx) => {
      const targetSnap = await tx.get(targetRef);
      if (!targetSnap.exists) {
        throw new AppError(404, "TARGET_NOT_FOUND", "Target not found");
      }

      if (targetType === "post") {
        const post = targetSnap.data() as Post;
        this.guardPostVisibility(post, user);
      }

      const likeSnap = await tx.get(likeRef);
      const currentCount = Number(targetSnap.get("likeCount") ?? 0);

      if (likeSnap.exists) {
        tx.delete(likeRef);
        const nextCount = Math.max(0, currentCount - 1);
        tx.update(targetRef, {
          likeCount: nextCount,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return {liked: false, likeCount: nextCount};
      }

      tx.set(likeRef, {
        userId: user.sub,
        targetType,
        targetId: body.targetId,
        createdAt: Timestamp.now(),
      });
      const nextCount = currentCount + 1;
      tx.update(targetRef, {
        likeCount: nextCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {liked: true, likeCount: nextCount};
    });

    return result;
  }

  private guardPostVisibility(post: Post, user: UserContext) {
    if (post.visibility === "public") return;
    if (!user) {
      throw new AppError(403, "FORBIDDEN", "Authentication required");
    }
    if (post.visibility === "members_only") {
      if (!user.roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
        throw new AppError(403, "FORBIDDEN", "Members only");
      }
      return;
    }
    if (post.visibility === "private") {
      if (post.authorUserId !== user.sub && !user.roles.includes("ADMIN")) {
        throw new AppError(403, "FORBIDDEN", "Private target");
      }
    }
  }

  private normalizeTargetType(type: TargetType | string): TargetType {
    if (type === "post" || type === "project" || type === "seminar") {
      return type;
    }
    throw new AppError(400, "INVALID_ARGUMENT", "Invalid targetType");
  }

  private buildLikeId(type: TargetType, id: string, userId: string) {
    return `${type}_${id}_${userId}`;
  }
}
