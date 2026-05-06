import { notFound } from "next/navigation";

import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { getTicketByCode } from "@/lib/data/tickets";
import { mapTicketDetailToUiTicket } from "@/lib/data/ticket-mappers";
import { tickets as mockTickets } from "@/lib/mock-data";

type TicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;

  try {
    const dbTicket = await getTicketByCode(ticketId);

    if (dbTicket) {
      return <TicketDetailClient ticket={mapTicketDetailToUiTicket(dbTicket)} />;
    }
  } catch {
    const fallbackTicket = mockTickets.find((ticket) => ticket.id === ticketId);

    if (fallbackTicket) {
      return <TicketDetailClient ticket={fallbackTicket} />;
    }

    notFound();
  }

  const fallbackTicket = mockTickets.find((ticket) => ticket.id === ticketId);

  if (!fallbackTicket) {
    notFound();
  }

  return <TicketDetailClient ticket={fallbackTicket} />;
}