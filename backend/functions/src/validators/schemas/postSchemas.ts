import {z} from "zod";

const tipTapDocSchema = z
  .object({
    type: z.literal("doc"),
  })
  .passthrough();

const tipTapInputSchema = z.union([tipTapDocSchema, z.string().trim().min(1)]);

const visibilitySchema = z.enum(["public", "members_only", "private"]);
const postTypeSchema = z.enum(["blog", "notice"]);
const tagsSchema = z.array(z.string().trim().min(1)).max(10).optional();

export const createPostSchema = z.object({
  type: postTypeSchema,
  title: z.string().trim().min(1, "title is required"),
  content: tipTapInputSchema,
  thumbnailUrl: z.string().url().optional(),
  tags: tagsSchema,
  visibility: visibilitySchema.optional(),
});

export const updatePostSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    content: tipTapInputSchema.optional(),
    thumbnailUrl: z.union([z.string().url(), z.null()]).optional(),
    tags: tagsSchema,
    visibility: visibilitySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const postIdParamsSchema = z.object({
  postId: z.string().trim().min(1, "postId is required"),
});
