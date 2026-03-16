import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  isAnonymous: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
  theme: z
    .object({
      accentColor: z.string().default("#6366F1"),
      backgroundColor: z.string().default("#0F0F13"),
      fontFamily: z.string().default("Geist"),
    })
    .optional(),
});

export const questionSchema = z.object({
  type: z.enum([
    "SHORT_TEXT",
    "LONG_TEXT",
    "MULTIPLE_CHOICE",
    "CHECKBOX",
    "DROPDOWN",
    "RATING",
    "NPS",
    "DATE",
    "FILE_UPLOAD",
    "LINEAR_SCALE",
    "YES_NO",
  ]),
  label: z.string().min(1, "Question text is required"),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export const submitResponseSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.string(),
    })
  ),
});

export const aiPromptSchema = z.object({
  prompt: z.string().min(10, "Please describe your form in at least 10 characters"),
});

export const apiKeySchema = z.object({
  apiKey: z.string().min(1).optional().nullable(),
});

export type FormValues = z.infer<typeof formSchema>;
export type QuestionValues = z.infer<typeof questionSchema>;
export type SubmitResponseValues = z.infer<typeof submitResponseSchema>;
export type AiPromptValues = z.infer<typeof aiPromptSchema>;
