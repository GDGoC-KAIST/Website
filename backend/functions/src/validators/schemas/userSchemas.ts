import {z} from "zod";

export const linkMemberSchema = z.object({
  linkCode: z.string().trim().min(1, "linkCode is required"),
});
