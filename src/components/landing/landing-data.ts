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
    title: "What goes in",
    value: "The report you already have",
    description: "Paste a support note or QA report without rewriting it first.",
  },
  {
    title: "What comes out",
    value: "A clear starting point",
    description: "Give engineering the impact, likely cause, and steps to reproduce.",
  },
  {
    title: "What stays together",
    value: "Evidence and decisions",
    description: "Keep screenshots, logs, updates, and ownership on the same issue.",
  },
];

export const features: FeatureCard[] = [
  {
    icon: Sparkles,
    title: "Consistent ticket drafts",
    description: "Turn uneven reports into a format engineers can scan quickly.",
  },
  {
    icon: FileStack,
    title: "Evidence in one place",
    description: "Keep screenshots, logs, and environment details with the report.",
  },
  {
    icon: FolderKanban,
    title: "A workflow people recognize",
    description: "Move bugs from new to investigating, in progress, fixed, and closed.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Keep workspace data scoped to members and store uploaded evidence privately.",
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Submit report",
    description: "Capture the complaint, device details, screenshots, and logs.",
  },
  {
    title: "Get a structured draft",
    description: "Review the suggested severity, category, steps, and likely cause.",
  },
  {
    title: "Review and assign",
    description: "Confirm the details, choose an owner, and move the ticket forward.",
  },
];

export const securityItems: SecurityItem[] = [
  { icon: Route, label: "Protected workspace routes" },
  { icon: LockKeyhole, label: "Private file handling" },
  { icon: CheckCircle2, label: "Suggestions checked before saving" },
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
    title: "Triage draft",
    detail: "Critical payment issue flagged for review",
  },
  {
    icon: CheckCircle2,
    title: "Ready ticket",
    detail: "Reproduction steps and next action included",
  },
] as const;
