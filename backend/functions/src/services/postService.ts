import {Timestamp} from "firebase-admin/firestore";
import {AppError} from "../utils/appError";
import {PostRepo, PostFilter} from "../repositories/postRepo";
import {Post, PostType, PostVisibility} from "../types/post";
import type {TipTapDoc} from "../types/tiptap";
import {extractPlainText, generateExcerpt, calculateReadingTime} from "../utils/tiptapUtils";
import {Role} from "../types/auth";

const MAX_TAGS = 10;

export interface CreatePostDto {
  type: PostType;
  title: string;
  content: TipTapDoc;
  thumbnailUrl?: string;
  tags?: string[];
  visibility?: PostVisibility;
}

export interface UpdatePostDto {
  title?: string;
  content?: TipTapDoc;
  thumbnailUrl?: string | null;
  tags?: string[];
  visibility?: PostVisibility;
}

export interface ListPostQuery {
  type?: PostType;
  authorUserId?: string;
  limit?: number;
  cursor?: string;
  query?: string;
}

export interface UserContext {
  sub: string;
  roles: Role[];
  memberId?: string;
}

export class PostService {
  private repo = new PostRepo();

  async createPost(user: UserContext, body: CreatePostDto): Promise<Post> {
    if (!body.type || !body.title || !body.content) {
      throw new AppError(400, "INVALID_ARGUMENT", "Missing required fields");
    }
    this.guardCreate(body.type, user.roles);
    const tags = this.validateTags(body.tags);
    const visibility = body.visibility ?? "public";
    const plainText = extractPlainText(body.content);

    const now = Timestamp.now();
    return await this.repo.createPost({
      type: body.type,
      title: body.title.trim(),
      content: body.content,
      excerpt: generateExcerpt(body.content),
      plainText,
      readingTime: calculateReadingTime(plainText),
      thumbnailUrl: body.thumbnailUrl,
      tags,
      visibility,
      authorUserId: user.sub,
      authorMemberId: user.memberId,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  async getPost(user: UserContext | undefined, postId: string): Promise<Post> {
    const post = await this.repo.findById(postId);
    if (!post) {
      throw new AppError(404, "POST_NOT_FOUND", "Post not found");
    }
    this.guardReadPost(post, user);
    return post;
  }

  async listPosts(user: UserContext | undefined, query: ListPostQuery) {
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const visibilities = this.allowedVisibilities(user, query.authorUserId);

    const filter: PostFilter = {
      type: query.type,
      authorUserId: query.authorUserId,
      visibilities,
      query: query.query,
    };

    return this.repo.listPosts(filter, limit, query.cursor);
  }

  async updatePost(user: UserContext, postId: string, body: UpdatePostDto): Promise<void> {
    const post = await this.repo.findById(postId);
    if (!post) {
      throw new AppError(404, "POST_NOT_FOUND", "Post not found");
    }
    this.guardMutatePost(post, user);
    const tags = this.validateTags(body.tags);
    const updateData: Partial<Post> = {};

    if (body.title) updateData.title = body.title.trim();
    if (body.content) {
      const plainText = extractPlainText(body.content);
      updateData.content = body.content;
      updateData.excerpt = generateExcerpt(body.content);
      updateData.plainText = plainText;
      updateData.readingTime = calculateReadingTime(plainText);
    }
    if (body.thumbnailUrl === null) {
      updateData.thumbnailUrl = "";
    } else if (body.thumbnailUrl) {
      updateData.thumbnailUrl = body.thumbnailUrl;
    }
    if (tags) updateData.tags = tags;
    if (body.visibility) updateData.visibility = body.visibility;

    await this.repo.updatePost(postId, updateData);
  }

  async deletePost(user: UserContext, postId: string): Promise<void> {
    const post = await this.repo.findById(postId);
    if (!post) {
      throw new AppError(404, "POST_NOT_FOUND", "Post not found");
    }
    this.guardMutatePost(post, user);
    await this.repo.deletePost(postId);
  }

  private guardCreate(type: PostType, roles: Role[]) {
    if (type === "notice" && !roles.includes("ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Only admins can create notices");
    }
    if (type === "blog" && !roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Only members can create blogs");
    }
  }

  private guardReadPost(post: Post, user?: UserContext) {
    if (post.visibility === "public") return;
    if (!user) {
      throw new AppError(403, "FORBIDDEN", "Authentication required");
    }
    if (post.visibility === "members_only") {
      if (!user.roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
        throw new AppError(403, "FORBIDDEN", "Members only");
      }
    }
    if (post.visibility === "private") {
      if (post.authorUserId !== user.sub && !user.roles.includes("ADMIN")) {
        throw new AppError(403, "FORBIDDEN", "Private post");
      }
    }
  }

  private allowedVisibilities(user: UserContext | undefined, authorFilter?: string): PostVisibility[] {
    const vis: PostVisibility[] = ["public"];
    if (user && user.roles.some((role) => role === "MEMBER" || role === "ADMIN")) {
      vis.push("members_only");
    }
    if (user && (user.roles.includes("ADMIN") || (authorFilter && authorFilter === user.sub))) {
      vis.push("private");
    }
    return vis;
  }

  private guardMutatePost(post: Post, user: UserContext) {
    if (post.authorUserId !== user.sub && !user.roles.includes("ADMIN")) {
      throw new AppError(403, "FORBIDDEN", "Not allowed");
    }
  }

  private validateTags(tags?: string[]): string[] {
    if (!tags) return [];
    if (!Array.isArray(tags)) {
      throw new AppError(400, "INVALID_ARGUMENT", "tags must be an array");
    }
    const sanitized = tags.map((tag) => String(tag).trim()).filter(Boolean);
    if (sanitized.length > MAX_TAGS) {
      throw new AppError(400, "INVALID_ARGUMENT", "Too many tags");
    }
    return sanitized;
  }
}
