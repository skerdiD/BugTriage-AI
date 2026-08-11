"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  UserRound,
  Settings,
  Ticket,
  UploadCloud,
  Users,
} from "lucide-react";

import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { SidebarNavItem } from "@/components/dashboard/sidebar-nav-item";
import type { DashboardUser } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    title: "Report a bug",
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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
              <AppLogoMark className="size-11" />

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
                  Triage workspace
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
            "border-t border-white/10",
            isDesktopCollapsed ? "px-3 py-4" : "p-5"
          )}
        >
          <DropdownMenu
            open={isAccountMenuOpen}
            onOpenChange={setIsAccountMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label="Open account menu"
                aria-expanded={isAccountMenuOpen}
                className={cn(
                  "group/account w-full rounded-2xl border-white/10 bg-white/[0.035] text-left text-white shadow-sm shadow-black/10 transition-all duration-200 hover:border-violet-400/35 hover:bg-white/[0.06] hover:text-white aria-expanded:border-violet-400/40 aria-expanded:bg-violet-500/10",
                  isDesktopCollapsed
                    ? "h-11 justify-center px-0"
                    : "h-14 justify-start gap-3 px-3"
                )}
              >
                <Avatar
                  size={isDesktopCollapsed ? "default" : "lg"}
                  className="shrink-0 bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20"
                >
                  <AvatarFallback className="bg-transparent font-bold text-white">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>

                <span
                  className={cn(
                    "min-w-0 flex-1 overflow-hidden transition-all duration-200 ease-out",
                    isDesktopCollapsed
                      ? "max-w-0 -translate-x-2 opacity-0"
                      : "max-w-[150px] translate-x-0 opacity-100"
                  )}
                >
                  <span className="block truncate text-sm font-semibold leading-5">
                    Account
                  </span>
                </span>

                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/account:text-violet-200",
                    isAccountMenuOpen ? "rotate-180 text-violet-200" : "",
                    isDesktopCollapsed ? "hidden" : ""
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align={isDesktopCollapsed ? "center" : "start"}
              sideOffset={10}
              className="w-64 border border-white/10 bg-[#171724]/95 p-2 text-white shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <DropdownMenuLabel className="px-2 py-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                  Account
                </span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Profile and sign-in settings
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                asChild
                className="cursor-pointer gap-2 rounded-xl px-2.5 py-2.5 text-sm text-muted-foreground focus:bg-white/[0.06] focus:text-white"
              >
                <Link href="/profile">
                  <UserRound className="size-4 text-violet-200" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
                className="cursor-pointer gap-2 rounded-xl px-2.5 py-2.5 text-sm text-red-200 focus:bg-red-500/10 focus:text-red-100"
              >
                <LogOut className="size-4 text-red-300" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
