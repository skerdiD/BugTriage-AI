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

export type BugReportFormValues = {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  browser: (typeof supportedBugReportBrowsers)[number];
  device: (typeof supportedBugReportDevices)[number];
  environment: (typeof supportedBugReportEnvironments)[number];
  affectedPage: string;
  consoleLogs: string;
};

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
