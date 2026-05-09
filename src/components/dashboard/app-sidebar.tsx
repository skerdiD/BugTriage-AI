"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Ticket,
  UploadCloud,
  Users,
  Zap,
} from "lucide-react";

import { SidebarNavItem } from "@/components/dashboard/sidebar-nav-item";
import type { DashboardUser } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
] as const;

type AppSidebarProps = {
  user: DashboardUser;
  className?: string;
  isMobile?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function AppSidebar({
  user,
  className,
  isMobile = false,
  collapsed = false,
  onToggleCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isDesktopCollapsed = !isMobile && collapsed;

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

  const logoutButton = (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label={isDesktopCollapsed ? "Logout" : undefined}
      className={cn(
        "rounded-2xl border-white/10 bg-white/[0.035] text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-200",
        isDesktopCollapsed
          ? "h-11 w-11 px-0"
          : "h-11 w-full justify-start px-4"
      )}
    >
      <LogOut
        className={cn("size-4 shrink-0", isDesktopCollapsed ? "" : "mr-2")}
      />
      <span
        className={cn(
          "truncate transition-all duration-200 ease-out",
          isDesktopCollapsed
            ? "max-w-0 -translate-x-1 opacity-0"
            : "max-w-[120px] translate-x-0 opacity-100"
        )}
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </span>
    </Button>
  );

  return (
    <TooltipProvider delayDuration={120}>
      <aside
        className={cn(
          "z-40 flex flex-col border-r border-white/10 bg-[#101017]/95 backdrop-blur-xl transition-[width] duration-300 ease-out",
          isMobile
            ? "h-full w-full"
            : cn(
                "fixed inset-y-0 left-0",
                isDesktopCollapsed ? "w-[84px]" : "w-[280px]"
              ),
          className
        )}
      >
        <div
          className={cn(
            "border-b border-white/10",
            isDesktopCollapsed ? "px-3 py-4" : "px-5 py-5"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              isDesktopCollapsed ? "justify-center" : "justify-between gap-3"
            )}
          >
            <Link
              href="/dashboard"
              aria-label="BugTriage AI Dashboard"
              className={cn(
                "group flex min-w-0 items-center transition-all",
                isDesktopCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                <Zap className="size-5 text-white" />
              </div>

              <div
                className={cn(
                  "min-w-0 overflow-hidden transition-all duration-200 ease-out",
                  isDesktopCollapsed
                    ? "max-w-0 -translate-x-2 opacity-0"
                    : "max-w-[180px] translate-x-0 opacity-100"
                )}
              >
                <p className="truncate text-[1.15rem] font-bold tracking-tight text-white">
                  BugTriage AI
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Engineering Command
                </p>
              </div>
            </Link>

            {!isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleCollapsed}
                    aria-label={
                      isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-white"
                  >
                    {isDesktopCollapsed ? (
                      <ChevronRight className="size-4" />
                    ) : (
                      <ChevronLeft className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto",
            isDesktopCollapsed ? "px-3 py-5" : "px-4 py-6"
          )}
        >
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.title}
                  icon={item.icon}
                  isActive={isActive}
                  collapsed={isDesktopCollapsed}
                />
              );
            })}
          </div>
        </nav>

        <div
          className={cn(
            "space-y-3 border-t border-white/10",
            isDesktopCollapsed ? "px-3 py-4" : "p-5"
          )}
        >
          {isDesktopCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Avatar
                    size="lg"
                    className="bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20"
                  >
                    <AvatarFallback className="bg-transparent font-bold text-white">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                <div className="space-y-0.5">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-[11px] opacity-80">{user.email}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <Avatar
                size="lg"
                className="bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20"
              >
                <AvatarFallback className="bg-transparent font-bold text-white">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {isDesktopCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">{logoutButton}</div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            logoutButton
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
