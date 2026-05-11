import type { LucideIcon } from "lucide-react";
import {
  BadgeAlert,
  Blocks,
  Bug,
  Camera,
  CheckCheck,
  ClipboardList,
  FileCode2,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TriangleAlert,
  Users,
  Waypoints,
} from "lucide-react";

export type LandingNavItem = {
  href: string;
  label: string;
};

export type IconCardItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type StepItem = {
  step: string;
  title: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const landingNavItems: LandingNavItem[] = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
  { href: "#faq", label: "FAQ" },
];

export const problemCards: IconCardItem[] = [
  {
    icon: Bug,
    title: "Vague user complaints",
    description:
      "Teams receive messages like 'checkout is broken again' without enough detail to reproduce the issue confidently.",
  },
  {
    icon: FileCode2,
    title: "Missing technical context",
    description:
      "Logs, screenshots, browser details, and environment context often live in different places or never get captured at all.",
  },
  {
    icon: TimerReset,
    title: "Slow engineering handoff",
    description:
      "Support and product spend time rewriting reports before engineering can even start the real investigation.",
  },
  {
    icon: BadgeAlert,
    title: "Wrong priority decisions",
    description:
      "Without consistent triage, high-impact regressions and low-risk bugs can look equally urgent in the queue.",
  },
];

export const solutionFlow = [
  {
    label: "Input",
    title: "Collect the messy evidence once",
    description:
      "Capture screenshots, logs, user complaints, reproduction notes, and environment details in one submission flow.",
  },
  {
    label: "AI Processing",
    title: "Structure what matters for engineering",
    description:
      "Generate severity, category, likely cause, clean reproduction steps, and suggested fixes from the raw report.",
  },
  {
    label: "Output",
    title: "Ship a clean ticket to the queue",
    description:
      "Save a structured engineering ticket the team can review, prioritize, comment on, and track through resolution.",
  },
];

export const workflowStages: IconCardItem[] = [
  {
    icon: ClipboardList,
    title: "Submit bug report",
    description:
      "A support, QA, or product teammate submits the raw issue with screenshots, logs, and context.",
  },
  {
    icon: Sparkles,
    title: "AI triage result",
    description:
      "BugTriage AI transforms the report into a structured ticket with actionable fields instead of a wall of text.",
  },
  {
    icon: LayoutDashboard,
    title: "Team dashboard / ticket queue",
    description:
      "Engineering reviews the queue, compares severity, and acts on the most important tickets first.",
  },
];

export const featureCards: IconCardItem[] = [
  {
    icon: Sparkles,
    title: "AI-powered ticket generation",
    description:
      "Convert raw issue submissions into structured tickets without forcing the team to rewrite every report manually.",
  },
  {
    icon: TriangleAlert,
    title: "Severity and priority detection",
    description:
      "Keep triage more consistent with suggested severity levels, issue categories, and priority signals.",
  },
  {
    icon: Camera,
    title: "Screenshot and log support",
    description:
      "Attach visual evidence and debugging context so the first report is already useful to engineering.",
  },
  {
    icon: Waypoints,
    title: "Structured reproduction steps",
    description:
      "Generate cleaner steps, expected behavior, actual behavior, and likely cause from incomplete submissions.",
  },
  {
    icon: FolderKanban,
    title: "Team dashboard",
    description:
      "Review ticket activity, queue health, and workspace-level issue history from the same product surface.",
  },
  {
    icon: LockKeyhole,
    title: "Secure project workflow",
    description:
      "Keep access scoped through protected routes, private uploads, and server-side checks around ticket data.",
  },
];

export const howItWorksSteps: StepItem[] = [
  {
    step: "01",
    title: "Submit the bug",
    description:
      "Add the raw description, files, and environment details without worrying about perfect formatting.",
  },
  {
    step: "02",
    title: "AI analyzes the report",
    description:
      "The system organizes the issue into clear engineering fields and suggested triage output.",
  },
  {
    step: "03",
    title: "Review the ticket",
    description:
      "Your team checks the output, updates anything needed, and decides where the ticket belongs in the queue.",
  },
  {
    step: "04",
    title: "Resolve faster",
    description:
      "Engineering starts from a better ticket, with less back-and-forth and cleaner issue history.",
  },
];

export const useCases = [
  "SaaS teams handling incoming customer bugs across multiple product surfaces.",
  "QA teams that want cleaner handoff into engineering without rewriting every report.",
  "Startup founders who need a lightweight way to triage bugs before they become backlog noise.",
  "Support teams collecting complaints, screenshots, and reproduction context from users.",
  "Freelance developers managing issue intake for one or more client projects.",
  "Agencies maintaining client apps that need clearer bug workflow per workspace or project.",
];

export const resultCards: IconCardItem[] = [
  {
    icon: CheckCheck,
    title: "Less manual ticket writing",
    description:
      "Teams stop spending so much time translating support notes into engineering language.",
  },
  {
    icon: TriangleAlert,
    title: "Faster prioritization",
    description:
      "Severity suggestions and structured output make it easier to spot which bugs deserve attention first.",
  },
  {
    icon: Users,
    title: "Better support-to-engineering handoff",
    description:
      "Context lives with the ticket instead of disappearing across chat threads and ad hoc docs.",
  },
  {
    icon: Blocks,
    title: "Cleaner bug history",
    description:
      "Decisions, status changes, and ticket details stay attached to the same issue record over time.",
  },
  {
    icon: LayoutDashboard,
    title: "More organized product workflow",
    description:
      "The queue, dashboard, and ticket views give small teams a calmer way to manage incoming bugs.",
  },
];

export const trustHighlights: IconCardItem[] = [
  {
    icon: ShieldCheck,
    title: "Access stays protected",
    description:
      "Supabase Auth, protected routes, and workspace checks keep dashboard and ticket data scoped correctly.",
  },
  {
    icon: LockKeyhole,
    title: "Uploads stay private",
    description:
      "Screenshots and logs are validated, stored privately, and served through controlled access paths.",
  },
  {
    icon: Sparkles,
    title: "AI output stays structured",
    description:
      "Gemini runs through the Vercel AI SDK and the response is validated with Zod before saving.",
  },
];

export const techStack = [
  "Supabase Auth",
  "Supabase Storage",
  "Supabase Postgres",
  "Prisma",
  "Zod validation",
  "Gemini via Vercel AI SDK",
  "Protected routes",
  "Private uploads",
  "Sentry monitoring",
  "Vitest and Playwright coverage",
];

export const faqItems: FaqItem[] = [
  {
    question: "Is BugTriage AI replacing developers?",
    answer:
      "No. It replaces repetitive ticket cleanup work, not engineering judgment. Developers still review the issue, decide priority, and fix the bug.",
  },
  {
    question: "Can users upload screenshots and logs?",
    answer:
      "Yes. The product supports screenshot uploads, log files, and pasted console output so the AI has better context to work with.",
  },
  {
    question: "Does the AI output need review?",
    answer:
      "Yes. The goal is to give your team a strong first draft of a ticket, not to skip human review for severity, cause, or resolution choices.",
  },
  {
    question: "Who is this for?",
    answer:
      "It is useful for SaaS teams, QA, startup founders, support teams, freelancers, and agencies that need better bug intake and prioritization.",
  },
  {
    question: "Is this a real full-stack project?",
    answer:
      "Yes. The app uses a real Next.js App Router stack with Supabase, Prisma, authenticated routes, storage, AI integration, and tests in the repository.",
  },
];
