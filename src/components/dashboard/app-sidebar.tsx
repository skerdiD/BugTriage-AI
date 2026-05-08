"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Crown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Ticket,
  UploadCloud,
  Users,
  Zap,
} from "lucide-react";

import type { DashboardUser } from "@/components/dashboard/dashboard-shell";
import { WorkspaceContextSwitcher } from "@/components/dashboard/workspace-context-switcher";
import { Button } from "@/components/ui/button";
import type {
  ProjectSummary,
  WorkspaceSummary,
} from "@/lib/data/workspaces";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Submit Bug",
    href: "/submit-bug",
    icon: UploadCloud,
  },
  {
    title: "Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

type AppSidebarProps = {
  user: DashboardUser;
  workspace: WorkspaceSummary;
  project: ProjectSummary | null;
  workspaces: WorkspaceSummary[];
  projects: ProjectSummary[];
  className?: string;
  isMobile?: boolean;
};

function roleBadgeClass(role: WorkspaceSummary["role"]) {
  if (role === "OWNER") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-300";
  }

  if (role === "ADMIN") {
    return "border-sky-500/25 bg-sky-500/15 text-sky-300";
  }

  return "border-violet-500/25 bg-violet-500/15 text-violet-300";
}

export function AppSidebar({
  user,
  workspace,
  project,
  workspaces,
  projects,
  className,
  isMobile = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside
      className={cn(
        "z-40 flex flex-col border-r border-white/10 bg-[#101017]/95 backdrop-blur-xl",
        isMobile ? "h-full w-full" : "fixed inset-y-0 left-0 w-72",
        className
      )}
    >
      <div className="flex h-28 items-center border-b border-white/10 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Zap className="size-6 text-white" />
          </div>

          <div>
            <p className="text-2xl font-bold tracking-tight text-white">
              BugTriage AI
            </p>
            <p className="text-sm text-muted-foreground">Engineering Command</p>
          </div>
        </Link>
      </div>
      <WorkspaceContextSwitcher
        roleLabel={workspace.role}
        currentWorkspaceId={workspace.id}
        currentProjectId={project?.id ?? null}
        workspaces={workspaces}
        projects={projects}
      />

      <div className="px-4 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{workspace.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Owned by {workspace.ownerName}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]",
                roleBadgeClass(workspace.role)
              )}
            >
              {workspace.role}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
              <p className="font-medium text-white">{workspace.memberCount}</p>
              <p className="mt-1">Members</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
              <p className="font-medium text-white">{workspace.projectCount}</p>
              <p className="mt-1">Projects</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <FolderKanban className="size-3.5 text-sky-300" />
            {project ? (
              <span>
                Routing new bugs into <span className="font-medium text-white">{project.name}</span>.
              </span>
            ) : (
              <span>No active project selected yet.</span>
            )}
          </div>

          {workspace.role === "OWNER" ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-yellow-200/90">
              <Crown className="size-3.5" />
              Workspace owner controls this team space.
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/[0.12] text-white shadow-lg shadow-black/10"
                  : "text-muted-foreground hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "size-5 transition",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground group-hover:text-white"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20">
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-11 w-full rounded-2xl border-white/10 bg-white/[0.035] text-muted-foreground hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="mr-2 size-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
}
