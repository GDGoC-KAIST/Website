import {Timestamp} from "firebase-admin/firestore";
import {TipTapDoc} from "./tiptap";

export type PostType = "blog" | "notice";
export type PostVisibility = "public" | "members_only" | "private";

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: TipTapDoc;
  thumbnailUrl?: string;
  tags: string[];
  visibility: PostVisibility;
  authorUserId: string;
  authorMemberId?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isDeleted: boolean;
  excerpt?: string;
  plainText?: string;
  readingTime?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PostData = Omit<Post, "id">;
