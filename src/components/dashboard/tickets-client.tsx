"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  TicketFilters,
  type TicketStatusFilter,
} from "@/components/dashboard/ticket-filters";
import { TicketTable } from "@/components/dashboard/ticket-table";
import type { UiTicket as Ticket } from "@/lib/dashboard/types";

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
    return {
      All: initialTickets.length,
      New: initialTickets.filter((ticket) => ticket.status === "New").length,
      Investigating: initialTickets.filter(
        (ticket) => ticket.status === "Investigating"
      ).length,
      "In Progress": initialTickets.filter(
        (ticket) => ticket.status === "In Progress"
      ).length,
      Fixed: initialTickets.filter((ticket) => ticket.status === "Fixed").length,
      Closed: initialTickets.filter((ticket) => ticket.status === "Closed").length,
    };
  }, [initialTickets]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tickets"
        description="Manage and track AI-triaged bug reports"
      />

      <TicketFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        activeStatus={activeStatus}
        onActiveStatusChange={setActiveStatus}
        statusCounts={statusCounts}
      />

      {filteredTickets.length > 0 ? (
        <TicketTable tickets={filteredTickets} />
      ) : initialTickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="This workspace has not received any bug reports yet. Submit the first ticket to populate the queue."
        />
      ) : (
        <EmptyState
          title="No tickets found"
          description="Try changing your search query or switching to another status tab."
        />
      )}
    </div>
  );
}
