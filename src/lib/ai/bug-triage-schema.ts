import { z } from "zod";

export const bugTriageAiOutputSchema = z.object({
  improvedTitle: z.string().min(5).max(140),
  summary: z.string().min(20).max(1200),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: z.string().min(2).max(80),
  reproductionSteps: z.array(z.string().min(2)).min(1).max(10),
  likelyCause: z.string().min(10).max(1200),
  suggestedFix: z.string().min(10).max(1400),
  priorityScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  tags: z.array(z.string().min(2).max(32)).min(1).max(10),
  developerTask: z.string().min(10).max(1000),
});

export type BugTriageAiOutput = z.infer<typeof bugTriageAiOutputSchema>;
