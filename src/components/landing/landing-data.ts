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
      "Turn uneven reports into the same scannable shape without hiding the original words.",
  },
  {
    icon: FileStack,
    title: "Evidence that stays attached",
    description:
      "Keep screenshots, logs, browser details, and the affected route beside the report.",
  },
  {
    icon: FolderKanban,
    title: "Familiar status, clear owner",
    description:
      "Move work from new to investigating, in progress, fixed, and closed—without inventing a new process.",
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
    description: "Add the complaint, device details, screenshots, and whatever logs survived.",
  },
  {
    title: "Check the first pass",
    description: "Read the suggested severity, steps, and likely cause against the evidence.",
  },
  {
    title: "Hand it to an owner",
    description: "Correct anything that is off, assign the ticket, and record the next move.",
  },
];

export const securityItems: SecurityItem[] = [
  { icon: Route, label: "Members-only routes" },
  { icon: LockKeyhole, label: "Private evidence uploads" },
  { icon: CheckCircle2, label: "Drafts validated before save" },
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
  { label: "Status", value: "Needs review", tone: "emerald" },
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
    title: "Working draft",
    detail: "Safari checkout failure, high impact, needs confirmation",
  },
  {
    icon: CheckCircle2,
    title: "In the queue",
    detail: "Evidence, reproduction steps, and next move stay together",
  },
] as const;
