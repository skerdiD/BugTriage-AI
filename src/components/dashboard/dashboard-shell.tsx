"use client";

import Link from "next/link";
import { Menu, Zap } from "lucide-react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  ProjectSummary,
  WorkspaceSummary,
} from "@/lib/data/workspaces";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

type DashboardShellProps = {
  children: React.ReactNode;
  user: DashboardUser;
  workspace: WorkspaceSummary;
  project: ProjectSummary | null;
  workspaces: WorkspaceSummary[];
  projects: ProjectSummary[];
};

export function DashboardShell({
  children,
  user,
  workspace,
  project,
  workspaces,
  projects,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      <AppSidebar
        user={user}
        workspace={workspace}
        project={project}
        workspaces={workspaces}
        projects={projects}
        className="hidden lg:flex"
      />

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#08080d]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Zap className="size-4 text-white" />
          </div>
          <div>
            <p className="font-bold leading-none">BugTriage AI</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Engineering Command
            </p>
          </div>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-white/10 bg-white/[0.035]"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 border-white/10 bg-[#101017] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar
              user={user}
              workspace={workspace}
              project={project}
              workspaces={workspaces}
              projects={projects}
              isMobile
            />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
