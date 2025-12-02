// Enums
export type SeminarType = "invited" | "internal";
export type ProjectStatus = "ongoing" | "completed";

// Interfaces
export interface Seminar {
  id: string;
  title: string;
  summary: string;
  type: SeminarType;
  semester: string; // "YYYY-1" | "YYYY-2"
  contentMd: string; // Markdown body
  date?: string; // "YYYY-MM-DD"
  speaker?: string;
  affiliation?: string;
  location?: string;
  attachmentUrls?: string[];
  coverImageId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  semester: string;
  description?: string;
  githubUrl?: string;
  demoUrl?: string;
  thumbnailUrl?: string;
  teamMembers: string[];
  techStack: string[];
  readmeContent?: string;
  contentMd?: string;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

export interface Member {
  id: string;
  name: string;
  department: string;
  githubUsername: string;
  email: string;
  profileImageUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ImageDoc {
  id: string;
  name: string;
  description?: string;
  url: string;
}
