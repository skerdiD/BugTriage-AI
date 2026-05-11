import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-5 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(34,211,238,0.1),rgba(15,23,42,0.9))] p-7 shadow-[0_36px_120px_-78px_rgba(0,0,0,0.98)] md:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.22em] text-cyan-100/75 uppercase">
              Ready when your next report is not
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Start with a messy report. End with a clean ticket.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Make support-to-engineering handoff faster, clearer, and more
              organized.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full bg-white px-6 text-sm text-slate-950 transition active:scale-[0.98] hover:bg-slate-100"
            >
              <Link href="/submit-bug" aria-label="Submit a bug report">
                Submit a bug
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 rounded-full border-white/12 bg-white/[0.035] px-6 text-sm text-white transition active:scale-[0.98] hover:bg-white/[0.08]"
            >
              <Link href="/dashboard" aria-label="Open BugTriage AI dashboard">
                Open dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
