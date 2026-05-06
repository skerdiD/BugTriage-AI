import { z } from "zod";

export const bugReportFormSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(120, "Bug title must be less than 120 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(2000, "Description must be less than 2000 characters."),
  stepsToReproduce: z
    .string()
    .min(10, "Add at least one clear reproduction step.")
    .max(1500, "Steps must be less than 1500 characters."),
  expectedBehavior: z
    .string()
    .min(8, "Expected behavior must be at least 8 characters.")
    .max(800, "Expected behavior must be less than 800 characters."),
  actualBehavior: z
    .string()
    .min(8, "Actual behavior must be at least 8 characters.")
    .max(800, "Actual behavior must be less than 800 characters."),
  browser: z.string().min(1, "Select a browser."),
  device: z.string().min(1, "Select a device."),
  environment: z.string().min(1, "Select an environment."),
  affectedPage: z
    .string()
    .min(2, "Affected page or component is required.")
    .max(180, "Affected page must be less than 180 characters."),
  consoleLogs: z.string().max(8000, "Console logs must be less than 8000 characters."),
});

export type BugReportFormValues = z.infer<typeof bugReportFormSchema>;

export const defaultBugReportValues: BugReportFormValues = {
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
  consoleLogs:
    "TypeError: Cannot read properties of undefined reading paymentIntent\nat PaymentForm.submitPayment",
};
