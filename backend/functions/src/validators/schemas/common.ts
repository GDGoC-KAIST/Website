import {z} from "zod";

export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return 20;
      return Number(value);
    })
    .refine(
      (value) => !Number.isNaN(value) && Number.isInteger(value) && value >= 1 && value <= 100,
      {message: "limit must be between 1 and 100"}
    ),
  cursor: z.string().optional(),
});

export const idSchema = z.string().min(1, "id is required");

export const uuidSchema = z
  .string()
  .uuid({message: "Must be a valid UUID"});
