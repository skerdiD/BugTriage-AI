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

export const features: FeatureCard[] = [
  {
    icon: Sparkles,
    title: "A reliable first pass",
    description:
      "Turn inconsistent reports into a clear, scannable format without losing the original wording.",
  },
  {
    icon: FileStack,
    title: "Evidence that stays attached",
    description:
      "Keep screenshots, logs, browser details, and the affected route beside the report.",
  },
  {
    icon: FolderKanban,
    title: "Familiar statuses, clear owners",
    description:
      "Move tickets from new to investigating, in progress, fixed, and closed without changing your workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Workspace boundaries that hold",
    description:
      "Scope every ticket and upload to workspace members, with project-level routing built in.",
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Capture the report",
    description: "Add the problem description, device details, screenshots, and available logs.",
  },
  {
    title: "Review AI triage",
    description: "Compare the suggested severity, steps, and likely cause with the evidence.",
  },
  {
    title: "Assign the ticket",
    description: "Correct the suggestions as needed, assign the ticket, and record the next step.",
  },
];

export const securityItems: SecurityItem[] = [
  { icon: Route, label: "Members-only routes" },
  { icon: LockKeyhole, label: "Private evidence uploads" },
  { icon: CheckCircle2, label: "AI drafts validated before saving" },
  { icon: UserCheck, label: "Workspace-scoped access" },
];

export const inputChips = [
  "iPhone 15",
  "Safari 17.4",
  "Production checkout",
  "Happened twice",
] as const;

export const outputMeta = [
  { label: "Severity", value: "Critical", tone: "rose" },
  { label: "Area", value: "Checkout", tone: "cyan" },
  { label: "Status", value: "New", tone: "emerald" },
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
    detail: "Customer says checkout just hangs on their iPhone",
  },
  {
    icon: FileSearch,
    title: "AI triage draft",
    detail: "Safari checkout failure, high impact, needs confirmation",
  },
  {
    icon: CheckCircle2,
    title: "Ticket ready for review",
    detail: "Evidence, reproduction steps, and next step stay together",
  },
] as const;
