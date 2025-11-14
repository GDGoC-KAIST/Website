import {Timestamp} from "firebase-admin/firestore";

export interface MemberData {
  id?: string;
  name: string;
  email: string;
  department: string; // 학과
  githubUsername: string; // GitHub 사용자명
  profileImageUrl: string; // GitHub 프로필 사진 URL
  isAdmin?: boolean; // 관리자 여부
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const MEMBERS_COLLECTION = "members";

