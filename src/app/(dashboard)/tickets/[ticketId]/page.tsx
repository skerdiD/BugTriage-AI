import { notFound } from "next/navigation";

import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { tickets } from "@/lib/mock-data";

type TicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;
  const ticket = tickets.find((item) => item.id === ticketId);

  if (!ticket) {
    notFound();
  }

  return <TicketDetailClient ticket={ticket} />;
}