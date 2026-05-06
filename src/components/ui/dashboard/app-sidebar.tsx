"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  Ticket,
  UploadCloud,
  Users,
  Zap,
} from "lucide-react";

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
  className?: string;
  isMobile?: boolean;
};

export function AppSidebar({ className, isMobile = false }: AppSidebarProps) {
  const pathname = usePathname();

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
            <p className="text-2xl font-bold tracking-tight text-white">BugTriage AI</p>
            <p className="text-sm text-muted-foreground">Engineering Command</p>
          </div>
        </Link>
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
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="size-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Sarah Chen</p>
            <p className="truncate text-xs text-muted-foreground">Engineering Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
}