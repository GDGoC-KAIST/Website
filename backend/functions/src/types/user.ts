import {Timestamp} from "firebase-admin/firestore";

export enum UserStatus {
  PENDING = "pending", // 승인 대기
  APPROVED = "approved", // 승인됨
  REJECTED = "rejected", // 거부됨
}

export interface UserData {
  id?: string;
  githubId: string; // GitHub 사용자 ID
  githubUsername: string; // GitHub 사용자명
  email: string; // GitHub 이메일
  name: string; // GitHub 이름
  profileImageUrl: string; // GitHub 프로필 사진
  status: UserStatus; // 승인 상태
  isAdmin: boolean; // 관리자 여부
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  approvedAt?: Timestamp; // 승인된 시간
  approvedBy?: string; // 승인한 관리자 ID
}

export const USERS_COLLECTION = "users";

