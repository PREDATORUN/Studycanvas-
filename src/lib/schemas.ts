import { z } from "zod";
export const profileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(60),
    exam: z.enum(["JEE Main", "JEE Advanced", "NEET"]),
    grade: z.enum(["11", "12", "Other"]),
    targetYear: z
      .number()
      .int()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 6),
    subjects: z
      .array(z.enum(["Physics", "Chemistry", "Mathematics", "Biology"]))
      .min(1)
      .max(4),
    goal: z.string().trim().min(3).max(300),
  })
  .strict();
export const taskSchema = z
  .object({ title: z.string().trim().min(1).max(160) })
  .strict();
export const taskUpdateSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
    completed: z.boolean(),
  })
  .strict();
export type ProfileInput = z.infer<typeof profileSchema>;
export type Profile = ProfileInput & { role: "student" | "teacher" | "admin" };
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};
