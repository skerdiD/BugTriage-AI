"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { TicketFilters, type TicketStatusFilter } from "@/components/dashboard/ticket-filters";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { tickets } from "@/lib/mock-data";

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<TicketStatusFilter>("All");

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        ticket.id.toLowerCase().includes(normalizedSearch) ||
        ticket.title.toLowerCase().includes(normalizedSearch) ||
        ticket.category.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        activeStatus === "All" || ticket.status === activeStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activeStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      All: tickets.length,
      New: tickets.filter((ticket) => ticket.status === "New").length,
      Investigating: tickets.filter((ticket) => ticket.status === "Investigating").length,
      "In Progress": tickets.filter((ticket) => ticket.status === "In Progress").length,
      Fixed: tickets.filter((ticket) => ticket.status === "Fixed").length,
    };
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tickets"
        description="Manage and track AI-triaged bug reports"
        badge={`${filteredTickets.length} visible`}
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
      ) : (
        <EmptyState
          title="No tickets found"
          description="Try changing your search query or switching to another status tab."
        />
      )}
    </div>
  );
}