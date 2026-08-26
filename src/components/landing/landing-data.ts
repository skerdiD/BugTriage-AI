import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bug,
  CheckCircle2,
  FileSearch,
  FileStack,
  FolderKanban,
  GitBranch,
  LockKeyhole,
  Route,
  Search,
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
    title: "Structured AI analysis",
    description:
      "Generate a scannable summary, severity, category, reproduction steps, likely cause, and suggested fix.",
  },
  {
    icon: Search,
    title: "Semantic duplicate search",
    description:
      "Surface related tickets by meaning, not just exact wording, before the team repeats investigation work.",
  },
  {
    icon: GitBranch,
    title: "Clean GitHub handoff",
    description:
      "Export reviewed reports to GitHub Issues with the useful context already organized for engineering.",
  },
  {
    icon: BarChart3,
    title: "Patterns you can act on",
    description:
      "Track severity, report volume, affected pages, repeated patterns, and resolution trends in one view.",
  },
  {
    icon: FileStack,
    title: "Evidence stays attached",
    description:
      "Keep screenshots, logs, browser details, environment, and affected routes beside the original report.",
  },
  {
    icon: FolderKanban,
    title: "Ownership stays visible",
    description:
      "Route by workspace and project, move through familiar statuses, and keep the next owner clear.",
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
    shortDetail: "Report, screenshot, and logs",
  },
  {
    icon: FileSearch,
    title: "AI triage draft",
    detail: "Safari checkout failure, high impact, needs confirmation",
    shortDetail: "Impact, steps, and likely cause",
  },
  {
    icon: CheckCircle2,
    title: "Ticket ready for review",
    detail: "Evidence, reproduction steps, and next step stay together",
    shortDetail: "Review, assign, or export",
  },
] as const;
