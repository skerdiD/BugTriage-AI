import { notFound } from "next/navigation";

import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { getTicketByCode } from "@/lib/data/tickets";
import { mapTicketDetailToUiTicket } from "@/lib/data/ticket-mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSignedTicketFileUrl } from "@/lib/supabase/storage";

type TicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;
  const context = await getCurrentWorkspaceContextOrRedirect();
  const dbTicket = await getTicketByCode(ticketId, context.workspace.id);

  if (!dbTicket) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const attachmentDownloadUrls = Object.fromEntries(
    await Promise.all(
      dbTicket.attachments.map(async (attachment) => {
        try {
          const signedUrl = await createSignedTicketFileUrl(
            supabase,
            attachment.storagePath
          );

          return [attachment.id, signedUrl] as const;
        } catch {
          return [attachment.id, null] as const;
        }
      })
    )
  );

  return (
    <TicketDetailClient
      ticket={mapTicketDetailToUiTicket(dbTicket, attachmentDownloadUrls)}
    />
  );
}
