"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  TicketFilters,
  type TicketStatusFilter,
} from "@/components/dashboard/ticket-filters";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { Button } from "@/components/ui/button";
import type { UiTicketListItem as Ticket } from "@/lib/dashboard/types";

type TicketsClientProps = {
  initialTickets: Ticket[];
};

export function TicketsClient({ initialTickets }: TicketsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<TicketStatusFilter>("All");

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return initialTickets.filter((ticket) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        ticket.id.toLowerCase().includes(normalizedSearch) ||
        ticket.title.toLowerCase().includes(normalizedSearch) ||
        ticket.category.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        activeStatus === "All" || ticket.status === activeStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activeStatus, initialTickets, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<TicketStatusFilter, number> = {
      All: initialTickets.length,
      New: 0,
      Investigating: 0,
      "In Progress": 0,
      Fixed: 0,
      Closed: 0,
    };

    for (const ticket of initialTickets) {
      counts[ticket.status] += 1;
    }

    return counts;
  }, [initialTickets]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="The queue"
        description="Find a report, check who owns it, and make the next move obvious."
      >
        <Button
          asChild
          className="h-11 rounded-xl bg-violet-600 px-4 shadow-lg shadow-violet-500/20 hover:bg-violet-500"
        >
          <Link href="/submit-bug">
            <Plus className="size-4" />
            Add a report
          </Link>
        </Button>
      </PageHeader>

      <TicketFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        activeStatus={activeStatus}
        onActiveStatusChange={setActiveStatus}
        statusCounts={statusCounts}
        visibleCount={filteredTickets.length}
        totalCount={initialTickets.length}
        onClearFilters={() => {
          setSearchQuery("");
          setActiveStatus("All");
        }}
      />

      {filteredTickets.length > 0 ? (
        <TicketTable tickets={filteredTickets} />
      ) : initialTickets.length === 0 ? (
        <EmptyState
          title="No reports in this project"
          description="When something breaks, add what you know. The first ticket does not need to be perfect."
          actionLabel="Add the first report"
          actionHref="/submit-bug"
        />
      ) : (
        <EmptyState
          title="Nothing matches those filters"
          description="Try a shorter search, clear the status filter, or look in another project."
        />
      )}
    </div>
  );
}
