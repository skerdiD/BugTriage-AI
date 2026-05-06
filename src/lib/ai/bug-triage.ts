import "server-only";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import type { BugReportFormValues } from "@/lib/validation/bug-report";

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

export const BUG_TRIAGE_SYSTEM_PROMPT = `
You are BugTriage AI, a senior software engineering triage assistant.

Your job:
Transform messy bug reports, user complaints, console logs, and debugging context into structured engineering tickets.

Rules:
- Return structured JSON only.
- Do not include markdown.
- Do not include extra commentary.
- Be practical and engineering-focused.
- Do not exaggerate severity.
- Use CRITICAL only when the issue blocks revenue, auth, data integrity, security, production availability, or core user workflows.
- Use HIGH when many users are affected or an important workflow is degraded.
- Use MEDIUM for noticeable product bugs with workarounds.
- Use LOW for cosmetic, minor, or non-blocking issues.
- Reproduction steps must be clear and actionable.
- Suggested fix must be useful for a developer.
- Tags must be lowercase, short, and useful.
`;

type AnalyzeBugReportInput = {
  report: BugReportFormValues;
  logText?: string;
  attachmentNames?: string[];
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}\n\n[TRUNCATED]`;
}

function buildBugTriagePrompt({
  report,
  logText,
  attachmentNames = [],
}: AnalyzeBugReportInput) {
  return `
Analyze this bug report and return structured JSON only.

Bug title:
${report.title}

Description:
${report.description}

Steps to reproduce:
${report.stepsToReproduce}

Expected behavior:
${report.expectedBehavior}

Actual behavior:
${report.actualBehavior}

Browser:
${report.browser}

Device:
${report.device}

Environment:
${report.environment}

Affected page/component:
${report.affectedPage}

Pasted console logs:
${truncate(report.consoleLogs ?? "", 6000)}

Uploaded log text:
${truncate(logText ?? "", 12000)}

Attachment filenames:
${attachmentNames.length > 0 ? attachmentNames.join(", ") : "No attachments"}
`;
}

export async function analyzeBugReportWithGemini(
  input: AnalyzeBugReportInput
): Promise<BugTriageAiOutput> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY.");
  }

  const result = await generateObject({
    model: google("gemini-2.0-flash-001"),
    schema: bugTriageAiOutputSchema,
    system: BUG_TRIAGE_SYSTEM_PROMPT,
    prompt: buildBugTriagePrompt(input),
    temperature: 0.2,
  });

  const parsed = bugTriageAiOutputSchema.safeParse(result.object);

  if (!parsed.success) {
    throw new Error("AI returned an invalid bug triage response.");
  }

  return parsed.data;
}