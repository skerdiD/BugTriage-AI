"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Zap } from "lucide-react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { WorkspaceContextSwitcher } from "@/components/dashboard/workspace-context-switcher";
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
import { cn } from "@/lib/utils";

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

const SIDEBAR_COLLAPSED_STORAGE_KEY = "bt.sidebar.collapsed";

export function DashboardShell({
  children,
  user,
  workspace,
  project,
  workspaces,
  projects,
}: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasLoadedSidebarPreference, setHasLoadedSidebarPreference] =
    useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY
      );

      if (storedValue === "true") {
        setIsSidebarCollapsed(true);
      }
    } finally {
      setHasLoadedSidebarPreference(true);
    }
  }, []);

  function handleToggleSidebar() {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;

      try {
        window.localStorage.setItem(
          SIDEBAR_COLLAPSED_STORAGE_KEY,
          String(nextValue)
        );
      } catch {
        // Ignore localStorage failures and still allow the UI toggle to work.
      }

      return nextValue;
    });
  }

  return (
    <div className="min-h-screen bg-[#08080d]">
      <AppSidebar
        user={user}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
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
              aria-label="Open navigation"
              className="rounded-xl border-white/10 bg-white/[0.035]"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 border-white/10 bg-[#101017] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar user={user} isMobile />
          </SheetContent>
        </Sheet>
      </header>

      <main
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          hasLoadedSidebarPreference && isSidebarCollapsed
            ? "lg:pl-[84px]"
            : "lg:pl-[280px]"
        )}
      >
        <div className="mx-auto w-full max-w-[1880px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-6 flex justify-end lg:mb-8">
            <WorkspaceContextSwitcher
              roleLabel={workspace.role}
              currentWorkspaceId={workspace.id}
              currentProjectId={project?.id ?? null}
              workspaces={workspaces}
              projects={projects}
            />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
