"use client";

import Link, { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  collapsed: boolean;
};

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: SidebarNavItemProps) {
  const link = (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group relative flex h-11 items-center overflow-hidden rounded-xl border text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70",
        collapsed ? "justify-center px-0" : "gap-3 px-4",
        isActive
          ? "border-violet-400/30 bg-linear-to-r from-violet-500/18 via-violet-400/8 to-transparent text-white shadow-lg shadow-black/20"
          : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.055] hover:text-white"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-opacity",
          isActive ? "bg-violet-300 opacity-100" : "opacity-0"
        )}
      />
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl transition-colors",
          collapsed ? "size-9" : "size-8",
          isActive
            ? "bg-white/[0.08] text-white"
            : "bg-white/[0.03] text-muted-foreground group-hover:text-white"
        )}
      >
        <Icon className="size-[18px] stroke-[2.1]" />
      </span>
      <span
        className={cn(
          "truncate transition-all duration-200 ease-out",
          collapsed
            ? "max-w-0 -translate-x-1 opacity-0"
            : "max-w-[160px] translate-x-0 opacity-100"
        )}
      >
        {label}
      </span>
      <SidebarLinkPendingIndicator />
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarLinkPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-violet-200 opacity-0 transition-opacity duration-150",
        pending && "animate-pulse opacity-80"
      )}
    />
  );
}
