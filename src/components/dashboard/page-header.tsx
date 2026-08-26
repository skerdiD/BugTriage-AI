import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-balance text-3xl font-bold tracking-[-0.035em] text-white lg:text-4xl">
            {title}
          </h1>

          {badge ? (
            <Badge className="rounded-full border-violet-500/25 bg-violet-500/10 px-3 py-1 text-violet-200">
              {badge}
            </Badge>
          ) : null}
        </div>

        {description ? (
          <p className="mt-2.5 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>

      {children ? (
        <div className="flex w-full shrink-0 items-start gap-3 sm:w-auto sm:justify-end">
          {children}
        </div>
      ) : null}
    </div>
  );
}
