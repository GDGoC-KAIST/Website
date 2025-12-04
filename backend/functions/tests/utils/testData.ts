import admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import type {Role} from "../../src/types/auth";

export async function seedUser(userId: string, roles: Role[]): Promise<void> {
  await admin.firestore().collection("users").doc(userId).set({
    githubId: userId,
    githubUsername: `user-${userId}`,
    email: `${userId}@example.com`,
    name: `User ${userId}`,
    roles,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function seedPost(postId: string, data: Partial<Record<string, unknown>> = {}): Promise<void> {
  await admin.firestore().collection("posts").doc(postId).set({
    type: "blog",
    title: data.title ?? "Seed Post",
    content: data.content ?? "Seed content",
    visibility: data.visibility ?? "public",
    authorUserId: data.authorUserId ?? "author-1",
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    isDeleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function seedImage(imageId: string, uploaderUserId: string): Promise<void> {
  await admin.firestore().collection("images").doc(imageId).set({
    storagePath: "images/test.png",
    name: "test",
    url: "https://example.com/image.png",
    uploaderUserId,
    scope: "public",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}
