import { TicketsClient } from "@/components/dashboard/tickets-client";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { getTickets } from "@/lib/data/tickets";
import { mapTicketListItemToUiTicket } from "@/lib/data/ticket-mappers";

async function loadTickets() {
  const context = await getCurrentWorkspaceContextOrRedirect();
  const dbTickets = await getTickets({
    workspaceId: context.workspace.id,
    projectId: context.project?.id,
    take: 100,
  });

  return {
    tickets: dbTickets.map(mapTicketListItemToUiTicket),
    scopeLabel: context.project
      ? `${context.workspace.name} · ${context.project.name}`
      : context.workspace.name,
  };
}

export default async function TicketsPage() {
  const { tickets, scopeLabel } = await loadTickets();

  return (
    <TicketsClient
      initialTickets={tickets}
      source="database"
      scopeLabel={scopeLabel}
    />
  );
}
