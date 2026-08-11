import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivityItem } from "@/lib/dashboard/types";

type RecentActivityFeedProps = {
  items: RecentActivityItem[];
};

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Activity className="size-5 text-sky-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest updates in this project.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-5">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                    <ChevronRight className="size-4 text-violet-300" />
                  </div>
                  {index !== items.length - 1 ? (
                    <div className="h-full w-px bg-white/10" />
                  ) : null}
                </div>

                <div className="pb-5">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.time} on{" "}
                    <Link
                      href={`/tickets/${item.ticketId}`}
                      className="font-medium text-violet-300 transition hover:text-violet-200"
                    >
                      {item.ticketId}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.ticketTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            Ticket activity will appear here once teammates start submitting bugs,
            changing statuses, or adding comments.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
