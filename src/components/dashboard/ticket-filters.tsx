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
      <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
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
                placeholder="Search by ticket ID, title, or product area"
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
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Tabs
            value={activeStatus}
            onValueChange={(value) =>
              onActiveStatusChange(value as TicketStatusFilter)
            }
          >
            <TabsList
              aria-label="Filter tickets by status"
              className="h-auto w-max flex-nowrap justify-start gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 group-data-horizontal/tabs:h-auto"
            >
              {statusTabs.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="h-9 flex-none rounded-xl px-3 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white sm:text-sm"
                >
                  {status}
                  <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                    {statusCounts[status]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <p aria-live="polite" className="px-1 text-sm text-muted-foreground lg:px-0">
          <span className="font-semibold text-white">{visibleCount}</span> of{" "}
          {totalCount} {totalCount === 1 ? "ticket" : "tickets"}
        </p>
      </div>
    </div>
  );
}
