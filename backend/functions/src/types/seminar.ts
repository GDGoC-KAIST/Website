export type SeminarType = "invited" | "internal";

export interface SeminarDoc {
  id: string;

  // Core Info
  title: string;
  summary: string;
  type: SeminarType;

  // Metadata for Filtering
  semester: string;
  date?: string;
  speaker?: string;
  affiliation?: string;
  location?: string;

  // Content
  contentMd: string;

  // Resources & Links
  attachmentUrls?: string[];
  coverImageId?: string;

  // System
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  updatedBy?: string;
}

export const SEMINARS_COLLECTION = "seminars";
