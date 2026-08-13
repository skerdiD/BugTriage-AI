import { notFound } from "next/navigation";

import {
  hasTicketPermission,
  TicketPermission,
} from "@/lib/auth/authorization";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { findSimilarIssuesForTicket } from "@/lib/data/similar-issues";
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
  const dbTicket = await getTicketByCode(ticketId, context.workspace.id);

  if (!dbTicket) {
    notFound();
  }

  let attachmentDownloadUrls: Record<string, string | null> = {};

  if (dbTicket.attachments.length > 0) {
    try {
      const storageSupabase = createSupabaseAdminClient();

      attachmentDownloadUrls = Object.fromEntries(
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
    } catch {
      attachmentDownloadUrls = Object.fromEntries(
        dbTicket.attachments.map((attachment) => [attachment.id, null] as const)
      );
    }
  }

  const similarIssues = await findSimilarIssuesForTicket({
    ticketId: dbTicket.id,
    workspaceId: dbTicket.workspaceId,
    projectId: dbTicket.projectId,
  });

  return (
    <TicketDetailClient
      canExportGitHub={hasTicketPermission(
        context.role,
        TicketPermission.EXPORT
      )}
      canManageTicket={hasTicketPermission(
        context.role,
        TicketPermission.MANAGE
      )}
      ticket={mapTicketDetailToUiTicket(
        dbTicket,
        attachmentDownloadUrls,
        similarIssues
      )}
    />
  );
}
