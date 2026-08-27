import { z } from "zod";

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const supportedBugReportBrowsers = [
  "chrome",
  "safari",
  "firefox",
  "edge",
] as const;

export const supportedBugReportDevices = [
  "desktop",
  "ios-mobile",
  "android-mobile",
  "tablet",
] as const;

export const supportedBugReportEnvironments = [
  "production",
  "staging",
  "development",
] as const;

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
  return z
    .string()
    .transform(normalizeSingleLineText)
    .pipe(z.string().min(min, minMessage).max(max, maxMessage));
}

function multilineField(min: number, max: number, minMessage: string, maxMessage: string) {
  return z
    .string()
    .transform(normalizeMultilineText)
    .pipe(z.string().min(min, minMessage).max(max, maxMessage));
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
  browser: z.enum(supportedBugReportBrowsers, {
    error: () => ({ message: "Select a browser." }),
  }),
  device: z.enum(supportedBugReportDevices, {
    error: () => ({ message: "Select a device." }),
  }),
  environment: z.enum(supportedBugReportEnvironments, {
    error: () => ({ message: "Select an environment." }),
  }),
  affectedPage: singleLineField(
    2,
    180,
    "Affected page or component is required.",
    "Affected page must be 180 characters or fewer."
  ),
  consoleLogs: z
    .string()
    .transform(normalizeMultilineText)
    .pipe(
      z.string().max(8000, "Console logs must be 8,000 characters or fewer.")
    ),
});

export type BugReportFormValues = z.infer<typeof bugReportFormSchema>;

export const defaultBugReportValues: Partial<BugReportFormValues> = {
  title: "",
  description: "",
  stepsToReproduce: "",
  expectedBehavior: "",
  actualBehavior: "",
  environment: "production",
  affectedPage: "",
  consoleLogs: "",
};

export const exampleBugReportValues: BugReportFormValues = {
  title: "Payment form fails on Safari mobile",
  description:
    "User reported that when trying to complete checkout on Safari iOS, the payment form becomes unresponsive after entering card details. Submit button appears disabled even with valid input.",
  stepsToReproduce:
    "1. Navigate to /checkout on Safari iOS\n2. Fill in shipping information\n3. Enter credit card details\n4. Try to submit payment",
  expectedBehavior:
    "Payment form should submit successfully and process the transaction.",
  actualBehavior:
    "Submit button remains disabled and the checkout page becomes unresponsive.",
  browser: "safari",
  device: "ios-mobile",
  environment: "production",
  affectedPage: "/checkout/payment",
  consoleLogs: "",
};
