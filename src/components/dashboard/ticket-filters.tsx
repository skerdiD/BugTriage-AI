import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TicketStatusFilter =
  | "All"
  | "New"
  | "Investigating"
  | "In Progress"
  | "Fixed"
  | "Closed";

type TicketFiltersProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeStatus: TicketStatusFilter;
  onActiveStatusChange: (value: TicketStatusFilter) => void;
  statusCounts: Record<TicketStatusFilter, number>;
  visibleCount: number;
  totalCount: number;
  onClearFilters: () => void;
};

const statusTabs: TicketStatusFilter[] = [
  "All",
  "New",
  "Investigating",
  "In Progress",
  "Fixed",
  "Closed",
];

export function TicketFilters({
  searchQuery,
  onSearchQueryChange,
  activeStatus,
  onActiveStatusChange,
  statusCounts,
  visibleCount,
  totalCount,
  onClearFilters,
}: TicketFiltersProps) {
  const hasActiveFilters = searchQuery.trim().length > 0 || activeStatus !== "All";

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <label htmlFor="ticket-search" className="sr-only">
                Search tickets
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ticket-search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search ticket ID, title, or product area"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm"
              />
            </div>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onClearFilters}
                className="h-11 justify-center rounded-xl px-4 text-muted-foreground hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-4" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={activeStatus}
          onValueChange={(value) =>
            onActiveStatusChange(value as TicketStatusFilter)
          }
        >
          <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {statusTabs.map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="rounded-xl px-3 py-2 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white sm:text-sm"
              >
                {status}
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                  {statusCounts[status]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p aria-live="polite" className="text-sm text-muted-foreground">
          <span className="font-semibold text-white">{visibleCount}</span> of{" "}
          {totalCount} {totalCount === 1 ? "ticket" : "tickets"}
        </p>
      </div>
    </div>
  );
}
