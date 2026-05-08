import { z } from "zod";

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function stripUnsafeControlCharacters(value: string) {
  return value.replace(CONTROL_CHARACTERS_REGEX, "");
}

function normalizeSingleLineText(value: string) {
  return stripUnsafeControlCharacters(value).replace(/\s+/g, " ").trim();
}

function normalizeMultilineText(value: string) {
  return stripUnsafeControlCharacters(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeTag(value: string) {
  return normalizeSingleLineText(value)
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function singleLineField(min: number, max: number) {
  return z
    .string()
    .transform(normalizeSingleLineText)
    .pipe(z.string().min(min).max(max));
}

function multilineField(min: number, max: number) {
  return z
    .string()
    .transform(normalizeMultilineText)
    .pipe(z.string().min(min).max(max));
}

export const bugTriageAiOutputSchema = z.object({
  improvedTitle: singleLineField(5, 140),
  summary: multilineField(20, 1200),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: singleLineField(2, 80),
  reproductionSteps: z
    .array(z.string())
    .transform((steps) =>
      steps
        .map((step) =>
          normalizeSingleLineText(step).replace(/^\d+\.\s*/, "")
        )
        .filter(Boolean)
    )
    .pipe(z.array(z.string().min(2).max(240)).min(1).max(10)),
  likelyCause: multilineField(10, 1200),
  suggestedFix: multilineField(10, 1400),
  priorityScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  tags: z
    .array(z.string())
    .transform((tags) => Array.from(new Set(tags.map(normalizeTag).filter(Boolean))))
    .pipe(
      z
        .array(z.string().min(2).max(32).regex(/^[a-z0-9-]+$/))
        .min(1)
        .max(10)
    ),
  developerTask: multilineField(10, 1000),
});

export type BugTriageAiOutput = z.infer<typeof bugTriageAiOutputSchema>;
