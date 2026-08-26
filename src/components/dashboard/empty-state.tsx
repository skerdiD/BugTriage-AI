import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center p-7 text-center sm:p-10">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <SearchX className="size-6 text-violet-300" />
        </div>

        <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>

        {actionLabel && actionHref ? (
          <Button
            asChild
            className="mt-6 rounded-full bg-violet-600 px-5 hover:bg-violet-500"
          >
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
