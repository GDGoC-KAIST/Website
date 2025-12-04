import {api} from "@/lib/api";
import {normalizeUrl} from "./normalizeUrl";

export function isAbsoluteUrl(value?: string): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

export function extractImageUrl(image: Record<string, any> | undefined): string {
  if (!image) return "";
  const candidate =
    image.url ??
    image.downloadUrl ??
    image.downloadURL ??
    image.imageUrl ??
    image.publicUrl ??
    image.thumbnailUrl ??
    "";
  return candidate ? normalizeUrl(candidate) : "";
}

export async function fetchImageUrlById(imageId?: string): Promise<string | undefined> {
  if (!imageId) return undefined;
  try {
    const image = await api.getImage(imageId);
    const url = extractImageUrl(image as Record<string, any>);
    return url || undefined;
  } catch (error) {
    console.warn("Failed to fetch image", imageId, error);
    return undefined;
  }
}

export async function resolveThumbnailValue(thumbnail?: string): Promise<string | undefined> {
  if (!thumbnail) return undefined;
  if (isAbsoluteUrl(thumbnail)) {
    return normalizeUrl(thumbnail);
  }
  return fetchImageUrlById(thumbnail);
}
