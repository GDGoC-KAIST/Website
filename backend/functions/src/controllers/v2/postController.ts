import {Request, Response, NextFunction} from "express";
import {PostService} from "../../services/postService";
import {AppError} from "../../utils/appError";
import {validateContent} from "../../validators/contentValidator";
import {sanitizeContent} from "../../services/contentSanitizer";
import type {TipTapDoc} from "../../types/tiptap";
import type {Post} from "../../types/post";
import {Timestamp} from "firebase-admin/firestore";
import {createHash} from "crypto";

const postService = new PostService();

function optionalUser(req: Request) {
  return req.user
    ? {sub: req.user.sub, roles: req.user.roles, memberId: req.user.memberId}
    : undefined;
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const user = {sub: req.user.sub, roles: req.user.roles, memberId: req.user.memberId};
    const normalizedContent = normalizeContentInput(req.body?.content);
    if (!normalizedContent) {
      throw new AppError(400, "INVALID_CONTENT", "TipTap JSON content is required");
    }
    const content = sanitizeContent(validateContent(normalizedContent));
    const post = await postService.createPost(user, {...req.body, content});
    res.status(201).json({post: serializePost(post)});
  } catch (error) {
    next(error);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const user = optionalUser(req);
    const post = await postService.getPost(user, req.params.postId);

    // Simplified ETag: deterministic composite of post.id + updatedAt timestamp
    // This avoids issues with key ordering and side-effects like viewCount changes
    const updatedAt = post.updatedAt;
    const lastUpdate = updatedAt && typeof (updatedAt as any).toISOString === "function"
      ? (updatedAt as any).toISOString()
      : updatedAt?.toString() || "";
    const etagInput = `${post.id}:${lastUpdate}`;
    const etag = createHash("md5").update(etagInput).digest("hex");

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    const serializedPost = serializePost(post);
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.status(200).json({post: serializedPost});
  } catch (error) {
    next(error);
  }
}

export async function listPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const user = optionalUser(req);
    const result = await postService.listPosts(user, {
      type: req.query.type as any,
      authorUserId: req.query.authorUserId as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
      query: req.query.q as string | undefined,
    });
    const posts = result.posts.map(serializePost);
    res.status(200).json({posts, nextCursor: result.nextCursor});
  } catch (error) {
    next(error);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const user = {sub: req.user.sub, roles: req.user.roles, memberId: req.user.memberId};
    let content: TipTapDoc | undefined;
    if (req.body?.content !== undefined) {
      const normalizedContent = normalizeContentInput(req.body.content);
      if (!normalizedContent) {
        throw new AppError(400, "INVALID_CONTENT", "TipTap JSON content is required");
      }
      content = sanitizeContent(validateContent(normalizedContent));
    }
    await postService.updatePost(user, req.params.postId, {
      ...req.body,
      ...(content ? {content} : {}),
    });
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const user = {sub: req.user.sub, roles: req.user.roles, memberId: req.user.memberId};
    await postService.deletePost(user, req.params.postId);
    res.status(200).json({ok: true});
  } catch (error) {
    next(error);
  }
}

type SerializedPost = Omit<Post, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function serializePost(post: Post): SerializedPost {
  return {
    ...post,
    createdAt: toIsoString(post.createdAt),
    updatedAt: toIsoString(post.updatedAt),
  };
}

function toIsoString(value: Timestamp | Date | string): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value.toDate().toISOString();
}

function normalizeContentInput(input: unknown): TipTapDoc | null {
  if (!input) return null;
  if (typeof input === "string") {
    return stringToDoc(input);
  }
  if (typeof input === "object") {
    return input as TipTapDoc;
  }
  return null;
}

function stringToDoc(text: string): TipTapDoc {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };
}
