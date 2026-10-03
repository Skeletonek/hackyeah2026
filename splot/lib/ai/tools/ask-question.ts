import { z } from "zod";

export const askQuestionInput = z.object({
  question: z.string().trim().min(1).max(300).describe("Jedno krótkie pytanie, prostym językiem."),
  options: z.array(z.string().trim().min(1).max(80)).min(2).max(5).describe("Gotowe odpowiedzi do kliknięcia."),
  allowSkip: z.boolean().describe("Czy pokazać „Pomiń”."),
});

export type AskQuestionInput = z.infer<typeof askQuestionInput>;

/** The clicked option, or `null` when the person skipped or typed instead. */
export type AskQuestionOutput = string | null;
