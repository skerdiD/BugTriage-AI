import { notFound } from "next/navigation";

import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { getTicketByCode } from "@/lib/data/tickets";
import { mapTicketDetailToUiTicket } from "@/lib/data/ticket-mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSignedTicketFileUrl } from "@/lib/supabase/storage";

type TicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const [{ ticketId }, context] = await Promise.all([
    params,
    getCurrentWorkspaceContextOrRedirect(),
  ]);
  const dbTicket = await getTicketByCode(ticketId, context.workspace.id, {
    skipAccessCheck: true,
  });

  if (!dbTicket) {
    notFound();
  }

  const storageSupabase = createSupabaseAdminClient();
  const attachmentDownloadUrls = Object.fromEntries(
    await Promise.all(
      dbTicket.attachments.map(async (attachment) => {
        try {
          const signedUrl = await createSignedTicketFileUrl(
            storageSupabase,
            attachment.storagePath,
            dbTicket.workspaceId,
            undefined,
            dbTicket.code
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
