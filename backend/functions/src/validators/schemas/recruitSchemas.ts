import {z} from "zod";

const emailField = z.string().trim().email();
const stringField = z.string().trim().min(1);

export const recruitLoginSchema = z.object({
  kaistEmail: emailField,
  password: stringField,
});

const baseRecruitSchema = z
  .object({
    name: stringField,
    kaistEmail: emailField,
    googleEmail: emailField,
    phone: stringField,
    department: stringField,
    studentId: stringField,
    motivation: stringField,
    experience: stringField,
    wantsToDo: stringField,
    githubUsername: z.string().trim().optional(),
    portfolioUrl: z.string().trim().optional(),
    password: stringField,
  })
  .passthrough();

export const recruitApplySchema = baseRecruitSchema;

export const recruitUpdateSchema = baseRecruitSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const recruitResetSchema = z.object({
  kaistEmail: emailField,
});
