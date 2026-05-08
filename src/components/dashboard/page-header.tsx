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
        "flex flex-col gap-5 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {title}
          </h1>

          {badge ? (
            <Badge className="rounded-full border-violet-500/25 bg-violet-500/10 px-3 py-1 text-violet-200">
              {badge}
            </Badge>
          ) : null}
        </div>

        {description ? (
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {children ? (
        <div className="flex w-full shrink-0 items-start gap-3 md:w-auto md:justify-end">
          {children}
        </div>
      ) : null}
    </div>
  );
}
