import {z} from "zod";

const targetTypeSchema = z.enum(["post", "project", "seminar"]);

export const toggleLikeSchema = z.object({
  targetType: targetTypeSchema,
  targetId: z.string().trim().min(1, "targetId is required"),
});
