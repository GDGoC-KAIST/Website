import {Timestamp} from "firebase-admin/firestore";

export type ProjectStatus = "ongoing" | "completed";

export interface ProjectDoc {
  id?: string; // Auto-generated Firestore ID

  // Core Info
  title: string; // Required
  summary: string; // Required (1-2 sentences for UI card)
  description?: string; // Optional (Detailed description)

  // Metadata for Filtering
  semester: string; // Format: "YYYY-1" or "YYYY-2" (e.g., "2024-2")
  status: ProjectStatus; // Filter target

  // External Links
  githubUrl?: string; // e.g., "https://github.com/owner/repo"
  demoUrl?: string;
  thumbnailUrl?: string; // Simple string URL for MVP (managed by existing Image API)

  // Team & Tech
  teamMembers: string[]; // Array of names (Strings for MVP)
  techStack: string[]; // Array of strings

  // GitHub Integration (Cache)
  readmeContent?: string; // Raw Markdown fetched from GitHub
  readmeFetchedAt?: Timestamp; // When README was last fetched

  // User Content
  contentMd?: string; // User-written Markdown content

  // System
  createdAt?: Timestamp; // Timestamp
  updatedAt?: Timestamp;
  createdBy?: string; // User ID who created this project
}

export const PROJECTS_COLLECTION = "projects";
