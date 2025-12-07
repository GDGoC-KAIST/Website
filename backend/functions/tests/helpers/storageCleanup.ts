import {getStorage} from "firebase-admin/storage";

export async function clearStorageBucket(): Promise<void> {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles();
  if (files.length === 0) return;
  await Promise.all(files.map((file) => file.delete()));
}
