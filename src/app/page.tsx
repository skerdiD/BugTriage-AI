import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  Ticket,
  TriangleAlert,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "BugTriage AI | Turn Bug Reports Into Prioritized Engineering Tickets",
  description:
    "BugTriage AI gives product, support, and engineering teams a structured way to turn messy bug reports into prioritized, workspace-aware engineering tickets.",
};

const navItems = [
  { href: "#problem", label: "Problem" },
  { href: "#solution", label: "Solution" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#faq", label: "FAQ" },
];

const problemCards = [
  {
    icon: MessageSquareText,
    title: "Reports arrive incomplete",
    description:
      "Support notes, screenshots, and customer complaints often land without the reproduction steps engineers actually need.",
  },
  {
    icon: TriangleAlert,
    title: "Severity is still guesswork",
    description:
      "Without shared triage rules, urgent bugs and routine issues can end up competing in the same backlog.",
  },
  {
    icon: Users,
    title: "Handoff gets messy fast",
    description:
      "Product, support, and engineering teams spend time re-explaining the same bug instead of moving it toward resolution.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboards miss what matters first",
    description:
      "A list of tickets alone does not tell a small team which issues are risky, recurring, or blocking the most important workflow.",
  },
];

const featureCards = [
  {
    icon: Sparkles,
    title: "AI bug triage",
    description:
      "Convert raw bug reports into clearer engineering-ready tickets with structured summaries and next steps.",
  },
  {
    icon: TriangleAlert,
    title: "Severity and category detection",
    description:
      "Keep triage consistent with AI-assisted severity suggestions and cleaner categorization across incoming reports.",
  },
  {
    icon: Radar,
    title: "Priority queue",
    description:
      "Highlight what needs attention first with severity-aware priority signals and a clearer open-ticket queue.",
  },
  {
    icon: Ticket,
    title: "Structured ticket intake",
    description:
      "Capture expected behavior, actual behavior, affected page, environment, device, logs, and screenshots in one flow.",
  },
  {
    icon: Activity,
    title: "Comments and activity timeline",
    description:
      "Keep decisions, follow-up questions, and status changes visible on the ticket instead of scattered in chat threads.",
  },
  {
    icon: BarChart3,
    title: "Dashboard analytics",
    description:
      "See ticket trends, repeated patterns, category clusters, and workload signals from real workspace data.",
  },
  {
    icon: FolderKanban,
    title: "Workspace and project organization",
    description:
      "Separate client work, product surfaces, or internal teams with workspace-aware projects and permissions.",
  },
  {
    icon: LockKeyhole,
    title: "Secure attachments",
    description:
      "Validate files before upload and keep attachment access behind workspace checks and signed downloads.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Submit the messy report",
    description:
      "Capture the raw bug context once, including screenshots, logs, browser, environment, and expected behavior.",
  },
  {
    step: "02",
    title: "Let AI structure the ticket",
    description:
      "BugTriage AI suggests severity, category, likely cause, reproducible steps, and a priority score for review.",
  },
  {
    step: "03",
    title: "Review and collaborate as a team",
    description:
      "Update status, leave comments, and keep the ticket history attached to the issue instead of hidden in side channels.",
  },
  {
    step: "04",
    title: "Use the dashboard to steer focus",
    description:
      "Surface open risk, recurring patterns, and the bugs that deserve attention before they become backlog noise.",
  },
];

const benefits = [
  "Faster bug triage without forcing engineers to decode every report manually.",
  "Cleaner handoff between support, product, founders, and developers.",
  "Fewer repeated clarification loops before work can start.",
  "Better prioritization when a small team has to choose what matters now.",
  "A more useful bug history with comments, activity, and status context attached.",
  "Workspace-level visibility for agencies, freelancers, and SaaS teams juggling multiple products.",
];

const securityPillars = [
  "Workspace-scoped data access with server-side membership checks.",
  "Validated AI output before ticket writes so malformed responses do not silently pollute data.",
  "Safe file validation for screenshots and logs before uploads are accepted.",
  "Signed attachment downloads after workspace-safe ticket lookup.",
];

const techStack = [
  "Prisma",
  "Supabase Auth",
  "Supabase Storage",
  "Gemini",
  "Vercel AI SDK",
  "TypeScript",
  "Zod",
  "Next.js App Router",
];

const faqItems = [
  {
    question: "What does BugTriage AI actually do?",
    answer:
      "It helps teams turn incomplete bug reports into structured tickets with clearer severity, category, priority, activity history, and dashboard visibility.",
  },
  {
    question: "Does AI replace engineers or product triage?",
    answer:
      "No. It speeds up the first pass and gives the team a cleaner starting point, but engineers still review, update, comment on, and resolve the work.",
  },
  {
    question: "What happens if AI is unsure or unavailable?",
    answer:
      "The app falls back to a safe manual-review path so the ticket is still created without relying on a risky or malformed AI response.",
  },
  {
    question: "Can I organize bugs by workspace and project?",
    answer:
      "Yes. Workspaces and projects help separate teams, products, or client environments while keeping access scoped correctly.",
  },
  {
    question: "Can my team comment on tickets and update status?",
    answer:
      "Yes. Tickets support comments, activity logging, and status updates so the handoff and follow-up history stay attached to the issue.",
  },
  {
    question: "Is uploaded data protected?",
    answer:
      "Uploads are validated before acceptance, stored in private storage, and shared through signed URLs after workspace-safe access checks.",
  },
  {
    question: "Is BugTriage AI useful for small teams or freelancers?",
    answer:
      "Yes. It is especially useful when a small team needs better bug intake, prioritization, and client or product visibility without heavyweight process.",
  },
];

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <Badge className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-1 text-[0.7rem] font-semibold tracking-[0.24em] text-violet-200 uppercase">
        {eyebrow}
      </Badge>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
        {description}
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_34rem),radial-gradient(circle_at_85%_14%,rgba(56,189,248,0.14),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:92px_92px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.9),transparent)] opacity-35" />

      <LandingHeader navItems={navItems} />

      <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-28 lg:pt-24">
        <LandingReveal className="relative">
          <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[0.76rem] text-zinc-200 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.8)]">
            Built for support, product, and engineering handoff
          </Badge>

          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl lg:text-7xl">
            Turn messy bug reports into prioritized engineering tickets.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">
            BugTriage AI gives small teams a cleaner bug workflow: structured intake,
            AI-assisted triage, priority signals, comments, activity, and dashboards
            that show what needs attention first.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600 px-6 text-base text-white hover:from-violet-500 hover:via-fuchsia-500 hover:to-sky-500"
            >
              <Link href="/signup">
                Start triaging
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/10 bg-white/[0.03] px-6 text-base text-white hover:bg-white/[0.08]"
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Already using the app?{" "}
            <Link
              href="/login"
              className="text-zinc-200 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          </p>
        </LandingReveal>

        <LandingReveal delayMs={120}>
          <Card className="overflow-hidden rounded-[32px] border-white/10 bg-white/[0.045] py-0 shadow-[0_48px_120px_-56px_rgba(0,0,0,0.95)]">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-rose-400" />
                  <span className="size-3 rounded-full bg-amber-300" />
                  <span className="size-3 rounded-full bg-emerald-400" />
                </div>
                <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] text-zinc-300 uppercase">
                  Product preview
                </Badge>
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <div className="rounded-[26px] border border-white/10 bg-black/18 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-sm">
                      <p className="text-xs tracking-[0.22em] text-zinc-500 uppercase">
                        Incoming report
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        Login fails on mobile Safari after valid password entry
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full border border-rose-400/20 bg-rose-500/12 px-3 py-1 text-rose-200">
                        Critical
                      </Badge>
                      <Badge className="rounded-full border border-amber-300/20 bg-amber-400/12 px-3 py-1 text-amber-100">
                        Priority 97
                      </Badge>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    Customer enters valid credentials, sees the loading state, and lands
                    back on the login page with no session restored.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[26px] border border-violet-400/18 bg-violet-500/10 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.08]">
                          <Sparkles className="size-[18px] text-violet-200" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">AI triage card</p>
                          <p className="text-xs text-violet-200/80">
                            Structured before the team touches it
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white">
                        Confidence 94
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        { label: "Severity", value: "Critical" },
                        { label: "Category", value: "Auth" },
                        { label: "Status", value: "New" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                        >
                          <p className="text-[0.68rem] tracking-[0.2em] text-zinc-400 uppercase">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-4">
                      <p className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                        Suggested next step
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        Review auth callback handling on Safari mobile, confirm cookie
                        persistence, and add explicit failure messaging when session restore
                        does not complete.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.06]">
                          <Workflow className="size-[18px] text-sky-200" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">Priority queue</p>
                          <p className="text-xs text-zinc-500">What the team should see first</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "BUG-1024  Login fails on mobile Safari",
                          "BUG-1016  Dashboard chart freezes after filters",
                          "BUG-1008  Invite redirect lands in wrong workspace",
                        ].map((row) => (
                          <div
                            key={row}
                            className="rounded-2xl border border-white/10 bg-black/18 px-3 py-3 text-sm text-zinc-300"
                          >
                            {row}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.06]">
                          <Activity className="size-[18px] text-emerald-200" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">Team activity</p>
                          <p className="text-xs text-zinc-500">
                            Comments, status, and attachment context
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-emerald-400/14 bg-emerald-500/8 p-3 text-sm text-emerald-100">
                          Status moved to Investigating after workspace review.
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
                          <p className="text-xs text-zinc-500">Recent attachment check</p>
                          <div className="mt-3 space-y-2">
                            <Skeleton className="h-2.5 w-3/4 rounded-full bg-white/10" />
                            <Skeleton className="h-2.5 w-11/12 rounded-full bg-white/8" />
                            <Skeleton className="h-2.5 w-2/3 rounded-full bg-white/8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </LandingReveal>
      </section>

      <section
        id="problem"
        className="scroll-mt-24 border-y border-white/6 bg-black/12 py-20 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <SectionIntro
              eyebrow="Problem"
              title="Bug reports break down long before engineering can act on them."
              description="Most teams do not need more bug chatter. They need cleaner intake, clearer triage, and a shared place to decide what deserves attention next."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {problemCards.map((card, index) => (
              <LandingReveal key={card.title} delayMs={index * 70}>
                <Card className="h-full rounded-[28px] border-white/10 bg-white/[0.035] shadow-[0_28px_80px_-56px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:-translate-y-1.5">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <card.icon className="size-5 text-violet-200" />
                    </div>
                    <h3 className="mt-5 text-xl font-medium text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <LandingReveal>
            <SectionIntro
              eyebrow="Solution"
              title="BugTriage AI is a workflow tool, not just another AI box."
              description="It gives the team a practical operating system for bug intake, triage, prioritization, and follow-through across workspaces and projects."
            />

            <div className="mt-8 space-y-4">
              {[
                "Structured intake captures the details engineers usually have to chase down later.",
                "AI triage helps standardize severity, category, confidence, and likely next steps.",
                "Real ticket views, comments, status updates, and dashboards keep the handoff attached to the work.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-zinc-300"
                >
                  <CheckCircle2 className="mt-1 size-[18px] shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </LandingReveal>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                icon: Ticket,
                title: "Capture the report once",
                description:
                  "Bring in the messy report, logs, screenshots, affected page, environment, and browser context in a consistent format.",
              },
              {
                icon: Sparkles,
                title: "Standardize the first pass",
                description:
                  "Use AI-assisted severity, category, likely cause, and confidence scoring to reduce inconsistent triage.",
              },
              {
                icon: FolderKanban,
                title: "Keep work scoped correctly",
                description:
                  "Organize bugs by workspace and project so teams and client contexts do not bleed into each other.",
              },
              {
                icon: LayoutDashboard,
                title: "See the backlog clearly",
                description:
                  "Track recent activity, priority, repeated patterns, and ticket distribution from the same underlying data.",
              },
            ].map((card, index) => (
              <LandingReveal key={card.title} delayMs={90 + index * 70}>
                <Card className="h-full rounded-[30px] border-white/10 bg-white/[0.04] shadow-[0_28px_90px_-58px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1.5">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <card.icon className="size-5 text-sky-200" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-y border-white/6 bg-black/10 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <SectionIntro
              eyebrow="Features"
              title="Everything on the landing page maps back to the product you actually have."
              description="No vague promise engine. Just the core capabilities teams need to collect, triage, discuss, and monitor bug work in one place."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature, index) => (
              <LandingReveal key={feature.title} delayMs={index * 50}>
                <Card className="h-full rounded-[28px] border-white/10 bg-white/[0.035] shadow-[0_30px_90px_-60px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/20">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <feature.icon className="size-5 text-violet-200" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <SectionIntro
              eyebrow="How It Works"
              title="A practical triage loop that stays close to how small teams already work."
              description="BugTriage AI keeps the workflow simple: capture the report, structure it, discuss it, and keep the team focused on what matters."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <LandingReveal key={step.step} delayMs={index * 80}>
                <Card className="h-full rounded-[30px] border-white/10 bg-white/[0.04] shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)]">
                  <CardContent className="p-6">
                    <p className="text-xs tracking-[0.26em] text-zinc-500 uppercase">
                      Step {step.step}
                    </p>
                    <h3 className="mt-4 text-xl font-medium text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/6 bg-black/12 py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <LandingReveal>
            <SectionIntro
              eyebrow="Results"
              title="The goal is not flashy automation. It is calmer, faster bug handling."
              description="BugTriage AI helps teams spend less energy cleaning up reports and more energy deciding what to fix, who owns it, and how the backlog is changing."
            />
          </LandingReveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <LandingReveal key={benefit} delayMs={index * 60}>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-5 text-sm leading-7 text-zinc-300 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 size-[18px] shrink-0 text-emerald-300" />
                    <span>{benefit}</span>
                  </div>
                </div>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <SectionIntro
              eyebrow="Security & Trust"
              title="Trust comes from concrete guardrails, not invented compliance logos."
              description="The product is built around workspace-safe access, validated inputs, protected uploads, and a typed server-side stack."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <LandingReveal delayMs={80}>
              <Card className="rounded-[32px] border-white/10 bg-white/[0.04] shadow-[0_32px_100px_-58px_rgba(0,0,0,0.95)]">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-emerald-500/10">
                      <ShieldCheck className="size-5 text-emerald-200" />
                    </span>
                    <div>
                      <p className="text-lg font-medium text-white">What the product already enforces</p>
                      <p className="text-sm text-zinc-500">Claims grounded in the current codebase</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {securityPillars.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-black/16 px-4 py-4 text-sm leading-7 text-zinc-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </LandingReveal>

            <LandingReveal delayMs={140}>
              <Card className="rounded-[32px] border-white/10 bg-white/[0.04] shadow-[0_32px_100px_-58px_rgba(0,0,0,0.95)]">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-sky-500/10">
                      <Zap className="size-5 text-sky-200" />
                    </span>
                    <div>
                      <p className="text-lg font-medium text-white">Typed modern stack</p>
                      <p className="text-sm text-zinc-500">Built around the tools powering the product today</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {techStack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-zinc-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[26px] border border-white/10 bg-black/18 p-5">
                    <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">
                      Why that matters
                    </p>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      The stack is designed to keep access control, validation, AI output,
                      uploads, and reporting close to the server-side workflows that actually
                      create and manage tickets.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </LandingReveal>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-y border-white/6 bg-black/12 py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <LandingReveal>
            <SectionIntro
              eyebrow="FAQ"
              title="Straight answers for teams deciding whether BugTriage AI fits their workflow."
              description="The product is designed to support engineering judgment, not replace it, and to give smaller teams more structure without more process overhead."
            />
          </LandingReveal>

          <LandingReveal className="mt-12" delayMs={90}>
            <LandingFaq items={faqItems} />
          </LandingReveal>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <LandingReveal>
            <Card className="rounded-[36px] border-white/10 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(14,165,233,0.14))] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)]">
              <CardContent className="flex flex-col gap-8 p-8 md:p-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <Badge className="rounded-full border border-white/14 bg-white/[0.08] px-4 py-1 text-[0.7rem] tracking-[0.22em] text-white uppercase">
                    Final CTA
                  </Badge>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    Give your team a cleaner way to triage bugs.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-zinc-200/82">
                    Start with structured intake, AI-assisted triage, and dashboards that
                    make the backlog easier to act on.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-white px-6 text-base text-zinc-950 hover:bg-zinc-100"
                  >
                    <Link href="/signup">
                      Start triaging
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-white/18 bg-white/[0.04] px-6 text-base text-white hover:bg-white/[0.1]"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </LandingReveal>
        </div>
      </section>

      <footer className="border-t border-white/6 pb-10 pt-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-start lg:justify-between">
          <LandingReveal className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 shadow-lg shadow-violet-500/20">
                <Zap className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-white/60 uppercase">
                  BugTriage AI
                </p>
                <p className="text-sm text-zinc-300">Engineering command center</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              BugTriage AI helps teams turn messy bug reports into structured,
              prioritized tickets with cleaner handoff, collaboration, and reporting.
            </p>
          </LandingReveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <LandingReveal delayMs={60}>
              <div>
                <p className="text-sm font-medium text-white">Navigate</p>
                <div className="mt-4 grid gap-3 text-sm text-zinc-400">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </LandingReveal>

            <LandingReveal delayMs={110}>
              <div>
                <p className="text-sm font-medium text-white">Product</p>
                <div className="mt-4 grid gap-3 text-sm text-zinc-400">
                  <Link href="/signup" className="transition-colors hover:text-white">
                    Start triaging
                  </Link>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Sign in
                  </Link>
                  <Link href="#features" className="transition-colors hover:text-white">
                    Core features
                  </Link>
                </div>
              </div>
            </LandingReveal>

            <LandingReveal delayMs={160}>
              <div>
                <p className="text-sm font-medium text-white">Built with</p>
                <div className="mt-4 grid gap-3 text-sm text-zinc-400">
                  <span>Next.js App Router</span>
                  <span>Prisma and Supabase</span>
                  <span>Gemini via Vercel AI SDK</span>
                </div>
              </div>
            </LandingReveal>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl px-6 text-sm text-zinc-600">
          © {new Date().getFullYear()} BugTriage AI. Built for calmer bug triage.
        </div>
      </footer>
    </main>
  );
}
