import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileWarning,
  Sparkles,
  TicketCheck,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileWarning,
    title: "Messy reports in",
    description: "Collect screenshots, logs, complaints, device info, and raw bug descriptions.",
  },
  {
    icon: Sparkles,
    title: "AI triage engine",
    description: "Turn raw reports into severity, category, root cause, steps, and suggested fixes.",
  },
  {
    icon: TicketCheck,
    title: "Clean tickets out",
    description: "Create structured engineering tasks your team can review, assign, and resolve.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">BugTriage AI</p>
            <p className="text-xs text-muted-foreground">Engineering Command</p>
          </div>
        </Link>

        <Button asChild className="rounded-xl bg-violet-600 hover:bg-violet-500">
          <Link href="/dashboard">
            Open Dashboard
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge className="mb-5 rounded-full border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-violet-200">
            Premium AI bug triage SaaS
          </Badge>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
            Turn messy bug reports into clean engineering tickets.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            BugTriage AI helps software teams convert screenshots, logs, user complaints,
            and unclear issue reports into prioritized, structured tickets ready for engineering.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-base hover:from-violet-500 hover:to-fuchsia-500"
            >
              <Link href="/dashboard">
                View Product
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-6 text-base hover:bg-white/[0.06]"
            >
              <Link href="/submit-bug">Submit Demo Bug</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border-white/10 bg-white/[0.035] shadow-2xl shadow-black/40">
          <CardContent className="p-0">
            <div className="border-b border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Raw report</p>
                    <h3 className="mt-2 text-lg font-semibold">
                      Payment form fails on Safari mobile
                    </h3>
                  </div>
                  <Badge className="bg-red-500/15 text-red-300">Critical</Badge>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  User says checkout becomes unresponsive after entering card details.
                  Submit button stays disabled even with valid input.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
                  <Sparkles className="mb-4 size-5 text-violet-300" />
                  <p className="text-sm font-medium">AI Output</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Severity, category, reproduction steps, likely cause, suggested fix,
                    and confidence score generated automatically.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <CheckCircle2 className="mb-4 size-5 text-emerald-300" />
                  <p className="text-sm font-medium">Ready ticket</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Assigned to engineering with status workflow, priority queue,
                    and dashboard visibility.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium">Weekly triage health</p>
                  <BarChart3 className="size-4 text-violet-300" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <p className="text-2xl font-bold">92%</p>
                    <p className="text-xs text-muted-foreground">AI accuracy</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <p className="text-2xl font-bold">12.4h</p>
                    <p className="text-xs text-muted-foreground">Avg fix time</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <p className="text-2xl font-bold">89</p>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 pb-16 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <feature.icon className="size-5 text-violet-300" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}