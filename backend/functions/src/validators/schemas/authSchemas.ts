import {z} from "zod";

export const loginSchema = z.object({
  githubAccessToken: z.string().trim().min(1, "githubAccessToken is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1, "refreshToken is required"),
});
