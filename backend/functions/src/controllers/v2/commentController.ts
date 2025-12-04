import type {Request, Response, NextFunction} from "express";
import {CommentService, CreateCommentDto, ListCommentQuery, UserContext} from "../../services/commentService";
import {AppError} from "../../utils/appError";
import type {Comment} from "../../types/schema";
import {Timestamp} from "firebase-admin/firestore";

const commentService = new CommentService();

function mapUser(req: Request): UserContext {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return {
    sub: req.user.sub,
    roles: req.user.roles,
  };
}

function mapOptionalUser(req: Request): UserContext | undefined {
  return req.user ? {sub: req.user.sub, roles: req.user.roles} : undefined;
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapUser(req);
    const comment = await commentService.createComment(user, req.body as CreateCommentDto);
    res.status(201).json({comment: serializeComment(comment)});
  } catch (error) {
    next(error);
  }
}

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapOptionalUser(req);
    const result = await commentService.listComments(user, {
      targetType: req.query.targetType as any,
      targetId: req.query.targetId as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
      parentId: req.query.parentId as string | undefined,
    } as ListCommentQuery);
    res.status(200).json({
      comments: result.comments.map(serializeComment),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = mapUser(req);
    await commentService.deleteComment(user, req.params.commentId);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}

type SerializableComment = Omit<Comment, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function serializeComment(comment: Comment): SerializableComment {
  return {
    ...comment,
    createdAt: toIso(comment.createdAt),
    updatedAt: toIso(comment.updatedAt),
  };
}

function toIso(value: Timestamp | Date | string): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return value.toDate().toISOString();
}
