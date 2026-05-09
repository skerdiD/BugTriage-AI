"use client";

import Link from "next/link";
import { ArrowRight, Menu, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type LandingNavItem = {
  href: string;
  label: string;
};

type LandingHeaderProps = {
  navItems: LandingNavItem[];
};

export function LandingHeader({ navItems }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08080d]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl outline-none transition-transform hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 shadow-lg shadow-violet-500/20">
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-white/60 uppercase">
              BugTriage AI
            </p>
            <p className="text-sm text-zinc-300">Engineering command center</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-300 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            asChild
            variant="ghost"
            className="rounded-full px-4 text-zinc-200 hover:bg-white/8 hover:text-white"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600 px-5 text-white hover:from-violet-500 hover:via-fuchsia-500 hover:to-sky-500"
          >
            <Link href="/signup">
              Start triaging
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full max-w-xs border-white/10 bg-[#090910]/96 p-0 text-white supports-backdrop-filter:backdrop-blur-2xl"
          >
            <SheetHeader className="border-b border-white/10 pb-5">
              <SheetTitle className="text-white">BugTriage AI</SheetTitle>
              <SheetDescription className="text-zinc-400">
                Structured bug intake for support, product, and engineering.
              </SheetDescription>
            </SheetHeader>

            <div className="flex h-full flex-col px-4 pb-6 pt-2">
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="rounded-2xl border border-transparent px-4 py-3 text-sm text-zinc-200 transition-colors hover:border-white/10 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto grid gap-3 pt-8">
                <SheetClose asChild>
                  <Link
                    href="/signup"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600 px-5 text-sm font-medium text-white transition-colors hover:from-violet-500 hover:via-fuchsia-500 hover:to-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    Start triaging
                    <ArrowRight className="size-4" />
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    Sign in
                  </Link>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
