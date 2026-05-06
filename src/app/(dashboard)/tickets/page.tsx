import { TicketsClient } from "@/components/dashboard/tickets-client";
import { getTickets } from "@/lib/data/tickets";
import { mapTicketListItemToUiTicket } from "@/lib/data/ticket-mappers";
import { ensureUserWorkspace } from "@/lib/data/workspaces";
import { tickets as mockTickets } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function loadTickets() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated.");

    const context = await ensureUserWorkspace({
      authUserId: user.id,
      email: user.email,
      name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined,
    });

    const dbTickets = await getTickets({
      workspaceId: context.workspace.id,
      take: 100,
    });

    if (dbTickets.length === 0) {
      throw new Error("No database tickets yet.");
    }

    return {
      source: "database" as const,
      tickets: dbTickets.map(mapTicketListItemToUiTicket),
    };
  } catch {
    return {
      source: "mock" as const,
      tickets: mockTickets,
    };
  }
}

export default async function TicketsPage() {
  const data = await loadTickets();

  return <TicketsClient initialTickets={data.tickets} source={data.source} />;
}