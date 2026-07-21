import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  inputText: z.string().min(1, "Input text is required"),
  operationType: z.enum(["uppercase", "lowercase", "reverse", "word_count"]),
});
