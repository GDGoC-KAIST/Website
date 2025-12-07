import {Request, Response, NextFunction} from "express";
import {PostService, CreatePostDto, UpdatePostDto} from "../../services/postService";
import {AppError} from "../../utils/appError";
import {validateContent} from "../../validators/contentValidator";
import {sanitizeContent} from "../../services/contentSanitizer";
import type {TipTapDoc} from "../../types/tiptap";
import type {Post} from "../../types/post";
import {Timestamp} from "firebase-admin/firestore";
import {createHash} from "crypto";
import {PostRepo} from "../../repositories/postRepo";

const postService = new PostService();
const postRepo = new PostRepo();

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
    const body = req.body as CreatePostDto;
    const normalizedContent =
      typeof body.content === "string" ? stringToDoc(body.content) : body.content;
    const content = sanitizeContent(validateContent(normalizedContent));
    const post = await postService.createPost(user, {...body, content});
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

    const viewCount = await postRepo.incrementViewCount(post.id);
    const serializedPost = serializePost({
      ...post,
      viewCount,
    });
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
    const body = req.body as UpdatePostDto;
    let content: TipTapDoc | undefined;
    if (body.content) {
      const normalizedContent =
        typeof body.content === "string" ? stringToDoc(body.content) : body.content;
      content = sanitizeContent(validateContent(normalizedContent));
    }
    await postService.updatePost(user, req.params.postId, {
      ...body,
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
