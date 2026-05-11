import type { LucideIcon } from "lucide-react";
import {
  Bug,
  FileStack,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";

export type LandingInsightCard = {
  label: string;
  value: string;
  detail: string;
};

export type LandingFeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type PreviewMetaItem = {
  label: string;
  value: string;
  tone: "default" | "critical" | "success";
};

export const landingInsightCards: LandingInsightCard[] = [
  {
    label: "Raw reports cleaned",
    value: "Messy -> structured",
    detail: "Turn vague intake into a ticket format engineering can scan quickly.",
  },
  {
    label: "Triage output",
    value: "Severity + cause",
    detail: "Highlight impact, likely cause, and the next thing to investigate.",
  },
  {
    label: "Team handoff",
    value: "Ready for review",
    detail: "Keep screenshots, logs, and triage context attached to the same issue.",
  },
];

export const landingFeatureCards: LandingFeatureCard[] = [
  {
    icon: Bug,
    title: "AI Ticket Generation",
    description:
      "Convert messy reports into structured tickets with clear summary, severity, and next steps.",
  },
  {
    icon: FileStack,
    title: "Screenshot & Log Context",
    description:
      "Keep visual evidence, logs, and environment details connected to every issue.",
  },
  {
    icon: FolderKanban,
    title: "Triage Workflow",
    description:
      "Move tickets through New, Triaged, In Review, Fixed, and Closed without losing context.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Full-Stack App",
    description:
      "Built with protected routes, user-scoped data, validation, private uploads, and production-style architecture.",
  },
];

export const previewChips = [
  "Safari",
  "iOS",
  "Checkout",
  "Payment",
  "Screenshot attached",
  "Console log",
] as const;

export const previewMeta: PreviewMetaItem[] = [
  { label: "Severity", value: "Critical", tone: "critical" },
  { label: "Category", value: "Payment / Checkout", tone: "default" },
  { label: "Status", value: "Triaged", tone: "success" },
  { label: "Confidence", value: "High", tone: "default" },
];

export const previewSteps = [
  "Open checkout on iPhone Safari.",
  "Enter card details and continue to payment.",
  "Watch the payment form stop responding before submission completes.",
] as const;

export const previewStructuredSections = [
  {
    title: "Likely cause",
    body: "Safari-specific form state or payment token handling is failing after card validation.",
  },
  {
    title: "Suggested fix",
    body: "Reproduce on iPhone Safari, inspect post-validation state transitions, and harden the payment submit flow.",
  },
] as const;
