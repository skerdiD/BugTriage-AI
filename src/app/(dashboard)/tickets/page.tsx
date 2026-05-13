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
    skipAccessCheck: true,
  });

  return {
    tickets: dbTickets.map(mapTicketListItemToUiTicket),
  };
}

export default async function TicketsPage() {
  const { tickets } = await loadTickets();

  return <TicketsClient initialTickets={tickets} />;
}
