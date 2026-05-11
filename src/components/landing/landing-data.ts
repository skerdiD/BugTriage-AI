import type { LucideIcon } from "lucide-react";
import {
  Bug,
  CheckCircle2,
  FileSearch,
  FileStack,
  FolderKanban,
  LockKeyhole,
  Route,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

export type ProofCard = {
  title: string;
  value: string;
  description: string;
};

export type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type WorkflowStep = {
  title: string;
  description: string;
};

export type SecurityItem = {
  icon: LucideIcon;
  label: string;
};

export const proofCards: ProofCard[] = [
  {
    title: "Raw reports cleaned",
    value: "Messy -> structured",
    description: "Turn vague intake into a ticket format engineering can scan.",
  },
  {
    title: "Triage output",
    value: "Severity + cause",
    description: "Surface impact, likely source, and the next investigation path.",
  },
  {
    title: "Engineering handoff",
    value: "Ready for review",
    description: "Keep screenshots, logs, and context attached to the same issue.",
  },
];

export const features: FeatureCard[] = [
  {
    icon: Sparkles,
    title: "AI Ticket Generation",
    description: "Convert messy reports into structured engineering tickets.",
  },
  {
    icon: FileStack,
    title: "Screenshot and Log Context",
    description: "Keep visual proof, logs, and environment details attached.",
  },
  {
    icon: FolderKanban,
    title: "Triage Workflow",
    description: "Move bugs through New, Triaged, In Review, Fixed, and Closed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Full-Stack Workflow",
    description:
      "Protected routes, user-scoped data, validation, and private uploads.",
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Submit report",
    description: "Capture the complaint, device details, screenshots, and logs.",
  },
  {
    title: "AI structures context",
    description: "Generate severity, category, reproduction steps, and likely cause.",
  },
  {
    title: "Team reviews and resolves",
    description: "Move a cleaner ticket through the engineering workflow.",
  },
];

export const securityItems: SecurityItem[] = [
  { icon: Route, label: "Protected workspace routes" },
  { icon: LockKeyhole, label: "Private file handling" },
  { icon: CheckCircle2, label: "Validated AI output" },
  { icon: UserCheck, label: "User-scoped data" },
];

export const inputChips = [
  "iPhone Safari",
  "Checkout",
  "Screenshot attached",
  "Console log attached",
] as const;

export const outputMeta = [
  { label: "Severity", value: "Critical", tone: "rose" },
  { label: "Category", value: "Payment", tone: "cyan" },
  { label: "Status", value: "Triaged", tone: "emerald" },
] as const;

export const outputSteps = [
  "Open checkout on iPhone Safari.",
  "Enter card details and continue.",
  "Payment form freezes before submission.",
] as const;

export const pipelineCards = [
  {
    icon: Bug,
    title: "Raw report",
    detail: "Checkout freezes on iPhone Safari",
  },
  {
    icon: FileSearch,
    title: "AI triage",
    detail: "Critical payment issue with high confidence",
  },
  {
    icon: CheckCircle2,
    title: "Ready ticket",
    detail: "Triaged with next fix path",
  },
] as const;
