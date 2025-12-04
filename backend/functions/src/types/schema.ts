import {Timestamp} from "firebase-admin/firestore";

export type ImageScope = "public" | "members" | "private";

export interface Image {
  id: string;
  url: string;
  storagePath: string;
  name: string;
  description?: string;
  uploaderUserId: string;
  scope: ImageScope;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NewImage = Omit<Image, "id">;

export type TargetType = "post" | "project" | "seminar";

export interface Comment {
  id: string;
  targetType: TargetType;
  targetId: string;
  writerUserId: string;
  content: string;
  parentId?: string | null;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NewComment = Omit<Comment, "id" | "isDeleted" | "createdAt" | "updatedAt">;

export interface Like {
  userId: string;
  targetType: TargetType;
  targetId: string;
  createdAt: Timestamp;
}

export interface Gallery {
  id: string;
  semester: string;
  title: string;
  description?: string;
  imageIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NewGallery = Omit<Gallery, "id" | "createdAt" | "updatedAt">;

export type RecruitApplicationStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "waitlist";

export interface RecruitApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  studentId: string;
  semester: string;
  answers: Record<string, string>;
  status: RecruitApplicationStatus;
  statusUpdatedAt?: Timestamp;
  statusUpdatedByUserId?: string;
  acceptedMemberId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecruitConfig {
  targetSemester: string;
  noticeBody: string;
  isOpen: boolean;
  openAt: Timestamp;
  closeAt: Timestamp;
  messageWhenClosed: string;
}
