import Link from "next/link";
import {
  Download,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

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
}: TicketFiltersProps) {
  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search by ticket id, title, or category..."
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
              >
                <Filter className="mr-2 size-4" />
                Filters
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
              >
                <Download className="mr-2 size-4" />
                Export
              </Button>

              <Button
                asChild
                className="col-span-2 rounded-xl bg-violet-600 shadow-lg shadow-violet-500/20 hover:bg-violet-500 sm:col-span-1"
              >
                <Link href="/submit-bug">
                  <Plus className="mr-2 size-4" />
                  Submit New Bug
                </Link>
              </Button>
            </div>
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

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
          <SlidersHorizontal className="size-4 text-violet-300" />
          Client-side filtering active
        </div>
      </div>
    </div>
  );
}
