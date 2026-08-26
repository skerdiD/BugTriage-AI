import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05060b]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          <AppLogoMark className="size-9 sm:size-10" iconClassName="size-6" />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white sm:tracking-[0.12em] sm:uppercase">
              BugTriage AI
            </p>
            <p className="hidden text-xs text-slate-400 sm:block">
              From report to fix
            </p>
          </div>
        </Link>

        <nav
          aria-label="Landing page"
          className="hidden items-center gap-1 lg:flex"
        >
          <Link
            href="#product-preview"
            className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Product tour
          </Link>
          <Link
            href="#features"
            className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Capabilities
          </Link>
          <Link
            href="#workflow"
            className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Workflow
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            className="h-9 rounded-full px-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white sm:px-4"
          >
            <Link href="/login">Sign in</Link>
          </Button>

          <Button
            asChild
            className="h-9 rounded-full bg-white px-3 text-slate-950 shadow-[0_14px_32px_-18px_rgba(255,255,255,0.75)] transition active:scale-[0.98] hover:bg-slate-100 sm:px-5"
          >
            <Link href="/login">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Explore demo</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
