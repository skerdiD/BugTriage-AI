import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  faqItems,
  featureCards,
  howItWorksSteps,
  landingNavItems,
  problemCards,
  resultCards,
  solutionFlow,
  techStack,
  trustHighlights,
  useCases,
  workflowStages,
} from "@/components/landing/landing-data";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { LandingSectionIntro } from "@/components/landing/landing-section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[#020617]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.18),transparent_30rem),radial-gradient(circle_at_88%_12%,rgba(16,185,129,0.12),transparent_26rem),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.08),transparent_24rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:92px_92px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85),transparent)] opacity-25" />

      <LandingHeader navItems={landingNavItems} />
      <LandingHero />

      <section
        id="problem"
        className="border-y border-white/6 bg-slate-950/40 py-20 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Problem"
              title="Bug reports are usually messy, incomplete, and hard to prioritize."
              description="Support, QA, and product teams rarely send engineering a perfect report. The real problem is not bug volume. It is the cleanup work before someone can confidently act on the issue."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {problemCards.map((card, index) => (
              <LandingReveal key={card.title} delayMs={index * 70}>
                <Card className="h-full rounded-[28px] border-white/10 bg-white/[0.035] shadow-[0_30px_90px_-60px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1.5">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <card.icon className="size-5 text-cyan-100" />
                    </div>
                    <h3 className="mt-5 text-xl font-medium text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Solution"
              title="A clean path from raw report to triaged engineering ticket."
              description="BugTriage AI takes the evidence your team already has and turns it into a ticket format engineering can review quickly. The workflow is simple: collect the input, structure the issue, then push it into a clear queue."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {solutionFlow.map((item, index) => (
              <LandingReveal key={item.label} delayMs={index * 80}>
                <Card className="h-full rounded-[30px] border-white/10 bg-white/[0.04] shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)]">
                  <CardContent className="p-6">
                    <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-cyan-100 uppercase">
                      {item.label}
                    </Badge>
                    <h3 className="mt-5 text-2xl font-medium text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/6 bg-slate-950/38 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Product Demo"
              title="See the workflow like a real product, not a mock marketing diagram."
              description="The core experience moves through three stages: submit the bug, review the AI result, and work the queue from a team dashboard."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 xl:grid-cols-[0.92fr_0.92fr_1.16fr]">
            {workflowStages.map((stage, index) => (
              <LandingReveal key={stage.title} delayMs={index * 90}>
                <Card className="h-full rounded-[30px] border-white/10 bg-white/[0.04] shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1.5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                        <stage.icon className="size-5 text-emerald-200" />
                      </div>
                      <span className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                        Stage 0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-medium text-white">{stage.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {stage.description}
                    </p>

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                      {index === 0 ? (
                        <div className="space-y-3 text-sm text-slate-300">
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                            Description, environment, and affected page
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                            Screenshot and log attachments
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                            Expected vs actual behavior
                          </div>
                        </div>
                      ) : null}

                      {index === 1 ? (
                        <div className="space-y-3 text-sm text-slate-300">
                          {["Severity: High", "Category: Upload", "Likely cause: Safari regression"].map(
                            (line) => (
                              <div
                                key={line}
                                className="rounded-2xl border border-cyan-400/16 bg-cyan-400/8 px-3 py-2.5"
                              >
                                {line}
                              </div>
                            )
                          )}
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                            Structured reproduction steps and suggested fix
                          </div>
                        </div>
                      ) : null}

                      {index === 2 ? (
                        <div className="space-y-3 text-sm text-slate-300">
                          {["Critical queue", "Recent activity", "Ticket trends"].map((line) => (
                            <div
                              key={line}
                              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                            >
                              <span>{line}</span>
                              <ChevronRight className="size-4 text-slate-500" />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Features"
              title="The product stays focused on practical triage work."
              description="Everything here maps to the actual platform: better ticket generation, clearer prioritization, private uploads, and a cleaner queue for the team."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => (
              <LandingReveal key={feature.title} delayMs={index * 60}>
                <Card className="h-full rounded-[28px] border-white/10 bg-white/[0.035] shadow-[0_30px_90px_-60px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-400/18">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <feature.icon className="size-5 text-cyan-100" />
                    </div>
                    <h3 className="mt-5 text-xl font-medium text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-white/6 bg-slate-950/40 py-20 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="How It Works"
              title="A simple four-step flow the whole team can scan quickly."
              description="The process is intentionally lightweight so BugTriage AI can sit between support, QA, product, and engineering without adding extra ceremony."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <LandingReveal key={step.step} delayMs={index * 80}>
                <Card className="h-full rounded-[30px] border-white/10 bg-white/[0.04] shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)]">
                  <CardContent className="p-6">
                    <p className="text-xs tracking-[0.26em] text-slate-500 uppercase">
                      Step {step.step}
                    </p>
                    <h3 className="mt-4 text-xl font-medium text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Use Cases"
              title="Built for teams that need better bug intake without heavyweight process."
              description="BugTriage AI is especially useful when one person captures the issue and another person needs to act on it quickly."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {useCases.map((item, index) => (
              <LandingReveal key={item} delayMs={index * 60}>
                <div className="rounded-[26px] border border-white/10 bg-white/[0.035] px-5 py-5 text-sm leading-7 text-slate-300 shadow-[0_26px_80px_-56px_rgba(0,0,0,0.9)]">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 size-[18px] shrink-0 text-emerald-200" />
                    <span>{item}</span>
                  </div>
                </div>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/6 bg-slate-950/40 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Results"
              title="Practical outcomes for day-to-day bug handling."
              description="The value is not hype. It is less cleanup work, better prioritization, and a queue the team can trust more quickly."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {resultCards.map((card, index) => (
              <LandingReveal key={card.title} delayMs={index * 60}>
                <Card className="h-full rounded-[28px] border-white/10 bg-white/[0.035] shadow-[0_30px_90px_-60px_rgba(0,0,0,0.9)]">
                  <CardContent className="p-6">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <card.icon className="size-5 text-emerald-200" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="Security & Trust"
              title="Production-style implementation, explained in plain language."
              description="The product is backed by authenticated routes, private uploads, validated inputs, and a full-stack data layer that reflects a real SaaS app build."
            />
          </LandingReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <LandingReveal delayMs={80}>
              <Card className="rounded-[32px] border-white/10 bg-white/[0.04] shadow-[0_34px_110px_-60px_rgba(0,0,0,0.95)]">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-emerald-500/10">
                      <ShieldCheck className="size-5 text-emerald-200" />
                    </span>
                    <div>
                      <p className="text-lg font-medium text-white">
                        Trust signals grounded in the repo
                      </p>
                      <p className="text-sm text-slate-400">
                        No invented compliance claims, just implementation details that matter.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {trustHighlights.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-slate-950/58 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4 text-cyan-100" />
                          <p className="text-sm font-medium text-white">{item.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </LandingReveal>

            <LandingReveal delayMs={140}>
              <Card className="rounded-[32px] border-white/10 bg-white/[0.04] shadow-[0_34px_110px_-60px_rgba(0,0,0,0.95)]">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-cyan-400/10">
                      <Zap className="size-5 text-cyan-100" />
                    </span>
                    <div>
                      <p className="text-lg font-medium text-white">Core stack highlights</p>
                      <p className="text-sm text-slate-400">
                        The landing page now reflects the real implementation underneath.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {techStack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-slate-950/55 px-4 py-2 text-sm text-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[26px] border border-cyan-400/18 bg-cyan-400/8 p-5">
                    <p className="text-xs tracking-[0.22em] text-cyan-100/70 uppercase">
                      Why it matters
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">
                      BugTriage AI is not just a front-end demo. It connects auth,
                      storage, validation, AI analysis, and persisted ticket workflows in
                      one maintainable Next.js application.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </LandingReveal>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-y border-white/6 bg-slate-950/40 py-20 md:py-24"
      >
        <div className="mx-auto max-w-5xl px-6">
          <LandingReveal>
            <LandingSectionIntro
              eyebrow="FAQ"
              title="The questions most teams ask before trying a workflow like this."
              description="The product is designed to speed up triage and handoff, while keeping engineers in control of the final decisions."
              align="center"
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
            <Card className="rounded-[36px] border-white/10 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(15,23,42,0.88),rgba(16,185,129,0.18))] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)]">
              <CardContent className="flex flex-col gap-8 p-8 md:p-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <Badge className="rounded-full border border-white/14 bg-white/[0.08] px-4 py-1 text-[0.7rem] tracking-[0.22em] text-white uppercase">
                    Final CTA
                  </Badge>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    Start with a messy report. End with a clean ticket.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-200/85">
                    Move from vague complaint to structured engineering handoff with a
                    workflow built for real teams.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-white px-6 text-base text-slate-950 hover:bg-slate-100"
                  >
                    <Link href="/submit-bug">
                      Submit Demo Bug
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-white/18 bg-white/[0.04] px-6 text-base text-white hover:bg-white/[0.1]"
                  >
                    <Link href="/dashboard">Open Dashboard</Link>
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
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0891b2,#10b981)] shadow-lg shadow-cyan-950/60">
                <Sparkles className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-white/60 uppercase">
                  BugTriage AI
                </p>
                <p className="text-sm text-slate-300">Structured bug triage for modern teams</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Turn screenshots, logs, and unclear issue reports into cleaner tickets,
              better prioritization, and a workflow engineering can trust.
            </p>
          </LandingReveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <LandingReveal delayMs={60}>
              <div>
                <p className="text-sm font-medium text-white">Navigate</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-400">
                  {landingNavItems.map((item) => (
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
                <p className="text-sm font-medium text-white">Actions</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-400">
                  <Link href="/submit-bug" className="transition-colors hover:text-white">
                    Submit Demo Bug
                  </Link>
                  <Link href="/dashboard" className="transition-colors hover:text-white">
                    Open Dashboard
                  </Link>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Sign in
                  </Link>
                </div>
              </div>
            </LandingReveal>

            <LandingReveal delayMs={160}>
              <div>
                <p className="text-sm font-medium text-white">Stack</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-400">
                  <span>Next.js App Router</span>
                  <span>Supabase, Prisma, and Zod</span>
                  <span>Gemini through Vercel AI SDK</span>
                </div>
              </div>
            </LandingReveal>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl px-6 text-sm text-slate-500">
          {"\u00A9"} {new Date().getFullYear()} BugTriage AI. Built for faster, cleaner bug triage.
        </div>
      </footer>
    </main>
  );
}

