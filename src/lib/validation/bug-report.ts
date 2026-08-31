import { z } from "zod/mini";

import {
  supportedBugReportBrowsers,
  supportedBugReportDevices,
  supportedBugReportEnvironments,
} from "@/lib/validation/bug-report-values";

export {
  defaultBugReportValues,
  exampleBugReportValues,
  supportedBugReportBrowsers,
  supportedBugReportDevices,
  supportedBugReportEnvironments,
} from "@/lib/validation/bug-report-values";
export type { BugReportFormValues } from "@/lib/validation/bug-report-values";

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

function singleLineField(min: number, max: number, minMessage: string, maxMessage: string) {
  return z.string().check(
    z.overwrite(normalizeSingleLineText),
    z.minLength(min, minMessage),
    z.maxLength(max, maxMessage)
  );
}

function multilineField(min: number, max: number, minMessage: string, maxMessage: string) {
  return z.string().check(
    z.overwrite(normalizeMultilineText),
    z.minLength(min, minMessage),
    z.maxLength(max, maxMessage)
  );
}

export const bugReportFormSchema = z.object({
  title: singleLineField(
    5,
    120,
    "Bug title must be at least 5 characters.",
    "Bug title must be 120 characters or fewer."
  ),
  description: multilineField(
    20,
    2000,
    "Description must be at least 20 characters.",
    "Description must be 2,000 characters or fewer."
  ),
  stepsToReproduce: multilineField(
    10,
    1500,
    "Add at least one clear reproduction step.",
    "Steps must be 1,500 characters or fewer."
  ),
  expectedBehavior: multilineField(
    8,
    800,
    "Expected behavior must be at least 8 characters.",
    "Expected behavior must be 800 characters or fewer."
  ),
  actualBehavior: multilineField(
    8,
    800,
    "Actual behavior must be at least 8 characters.",
    "Actual behavior must be 800 characters or fewer."
  ),
  browser: z.enum(supportedBugReportBrowsers, "Select a browser."),
  device: z.enum(supportedBugReportDevices, "Select a device."),
  environment: z.enum(
    supportedBugReportEnvironments,
    "Select an environment."
  ),
  affectedPage: singleLineField(
    2,
    180,
    "Affected page or component is required.",
    "Affected page must be 180 characters or fewer."
  ),
  consoleLogs: z.string().check(
    z.overwrite(normalizeMultilineText),
    z.maxLength(8000, "Console logs must be 8,000 characters or fewer.")
  ),
});
