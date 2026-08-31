import { notFound } from "next/navigation";

import {
  AuthorizationError,
  hasTicketPermission,
  TicketPermission,
} from "@/lib/auth/authorization";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { searchSimilarIssuesForTicket } from "@/lib/data/similar-issues";
import { getTicketByCode } from "@/lib/data/tickets";
import { mapTicketDetailToUiTicket } from "@/lib/data/ticket-mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSignedTicketFileUrl } from "@/lib/supabase/storage";

type TicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

type TicketDetailRecord = NonNullable<
  Awaited<ReturnType<typeof getTicketByCode>>
>;

async function createAttachmentDownloadUrls(ticket: TicketDetailRecord) {
  if (ticket.attachments.length === 0) {
    return {};
  }

  try {
    const storageSupabase = createSupabaseAdminClient();

    return Object.fromEntries(
      await Promise.all(
        ticket.attachments.map(async (attachment) => {
          try {
            const signedUrl = await createSignedTicketFileUrl(
              storageSupabase,
              attachment.storagePath,
              ticket.workspaceId,
              undefined,
              ticket.code
            );

            return [attachment.id, signedUrl] as const;
          } catch {
            return [attachment.id, null] as const;
          }
        })
      )
    );
  } catch {
    return Object.fromEntries(
      ticket.attachments.map((attachment) => [attachment.id, null] as const)
    );
  }
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const [{ ticketId }, context] = await Promise.all([
    params,
    getCurrentWorkspaceContextOrRedirect(),
  ]);
  let dbTicket: Awaited<ReturnType<typeof getTicketByCode>>;

  try {
    dbTicket = await getTicketByCode(ticketId, context.workspace.id);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      notFound();
    }

    throw error;
  }

  if (!dbTicket) {
    notFound();
  }

  // Attachment signing and semantic similarity search are independent remote
  // operations. Run them together so ticket detail latency is the slower of
  // the two paths instead of their sum.
  const [attachmentDownloadUrls, similarIssueSearch] = await Promise.all([
    createAttachmentDownloadUrls(dbTicket),
    searchSimilarIssuesForTicket({
      ticketId: dbTicket.id,
      workspaceId: dbTicket.workspaceId,
      projectId: dbTicket.projectId,
    }),
  ]);

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
        similarIssueSearch.issues,
        similarIssueSearch.status
      )}
    />
  );
}
