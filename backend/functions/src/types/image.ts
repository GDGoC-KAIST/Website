import {Timestamp} from "firebase-admin/firestore";

export interface ImageData {
  id?: string;
  name: string;
  description?: string;
  url: string;
  storagePath: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const IMAGES_COLLECTION = "images";

