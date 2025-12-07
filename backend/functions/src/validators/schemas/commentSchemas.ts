import {z} from "zod";

const targetTypeSchema = z.enum(["post", "project", "seminar"]);

const idString = z.string().trim().min(1, "Value is required");

export const createCommentSchema = z.object({
  targetType: targetTypeSchema,
  targetId: idString,
  content: z.string().trim().min(1, "content is required"),
  parentId: z
    .string()
    .trim()
    .min(1)
    .optional(),
});

export const getCommentsSchema = z.object({
  targetType: targetTypeSchema,
  targetId: idString,
  limit: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return undefined;
      const parsed = Number(value);
      return parsed;
    })
    .refine(
      (value) =>
        value === undefined ||
        (!Number.isNaN(value) && Number.isInteger(value) && value > 0 && value <= 50),
      {message: "limit must be an integer between 1 and 50"}
    ),
  cursor: z
    .string()
    .trim()
    .min(1)
    .optional(),
  parentId: z
    .string()
    .trim()
    .min(1)
    .optional(),
});

export const deleteCommentSchema = z.object({
  commentId: idString,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
