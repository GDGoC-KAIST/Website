import {db} from "../config/firebase";
import {AppError} from "../utils/appError";
import {CommentRepo, CommentFilter} from "../repositories/commentRepo";
import {Comment, TargetType} from "../types/schema";
import {Role} from "../types/auth";
import {Post} from "../types/post";

const TARGET_COLLECTIONS: Record<TargetType, string> = {
  post: "posts",
  project: "projects",
  seminar: "seminars",
};

export interface UserContext {
  sub: string;
  roles: Role[];
}

export interface CreateCommentDto {
  targetType: TargetType;
  targetId: string;
  content: string;
  parentId?: string;
}

export interface ListCommentQuery {
  targetType: TargetType;
  targetId: string;
  limit?: number;
  cursor?: string;
  parentId?: string;
}

export class CommentService {
  private repo = new CommentRepo();

  async createComment(user: UserContext, body: CreateCommentDto): Promise<Comment> {
    this.ensureAuthenticated(user);
    this.ensureValidContent(body.content);
    const targetType = this.normalizeTargetType(body.targetType);
    await this.resolveTargetAccess(user, targetType, body.targetId);
    return this.repo.createComment({
      targetType,
      targetId: body.targetId,
      writerUserId: user.sub,
      content: body.content.trim(),
      parentId: body.parentId,
    });
  }

  async listComments(user: UserContext | undefined, query: ListCommentQuery) {
    const targetType = this.normalizeTargetType(query.targetType);
    await this.resolveTargetAccess(user, targetType, query.targetId);
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter: CommentFilter = {
      targetType,
      targetId: query.targetId,
    };
    if (query.parentId !== undefined) {
      filter.parentId = query.parentId;
    }
    return this.repo.listComments(filter, limit, query.cursor);
  }

  async deleteComment(user: UserContext, commentId: string): Promise<void> {
    this.ensureAuthenticated(user);
    const comment = await this.repo.findById(commentId);
    if (!comment) {
      throw new AppError(404, "COMMENT_NOT_FOUND", "Comment not found");
    }
    if (comment.isDeleted) {
      return;
    }
    const isOwner = comment.writerUserId === user.sub;
    const isAdmin = user.roles.includes("ADMIN");
    if (!isOwner && !isAdmin) {
      throw new AppError(403, "FORBIDDEN", "Not allowed to delete this comment");
    }
    await this.repo.softDeleteComment(commentId, comment.targetType, comment.targetId);
  }

  private async resolveTargetAccess(user: UserContext | undefined, type: TargetType, id: string) {
    const collection = TARGET_COLLECTIONS[type];
    const docSnap = await db.collection(collection).doc(id).get();
    if (!docSnap.exists) {
      throw new AppError(404, "TARGET_NOT_FOUND", "Target not found");
    }

    if (type === "post") {
      const data = docSnap.data() as Post | undefined;
      if (!data || data.isDeleted) {
        throw new AppError(404, "TARGET_NOT_FOUND", "Target not found");
      }
      this.guardPostVisibility(data, user);
    }
  }

  private guardPostVisibility(post: Post, user?: UserContext) {
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

  private ensureAuthenticated(user?: UserContext) {
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
  }

  private ensureValidContent(content?: string) {
    const trimmed = content?.trim();
    if (!trimmed) {
      throw new AppError(400, "INVALID_ARGUMENT", "Content is required");
    }
    if (trimmed.length > 1000) {
      throw new AppError(400, "INVALID_ARGUMENT", "Content exceeds 1000 characters");
    }
  }

  private normalizeTargetType(type: TargetType | string): TargetType {
    if (type === "post" || type === "project" || type === "seminar") {
      return type;
    }
    throw new AppError(400, "INVALID_ARGUMENT", "Invalid target type");
  }
}
