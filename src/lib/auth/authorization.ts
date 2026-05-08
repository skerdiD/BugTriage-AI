import "server-only";

import { Prisma, WorkspaceRole } from "@prisma/client";

import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const workspaceAccessSelect = {
  id: true,
  name: true,
  slug: true,
  ownerId: true,
  members: {
    select: {
      role: true,
    },
    take: 1,
  },
} satisfies Prisma.WorkspaceSelect;

const ticketAccessSelect = {
  id: true,
  code: true,
  workspaceId: true,
  projectId: true,
  reporterId: true,
  assigneeId: true,
} satisfies Prisma.TicketSelect;

const projectAccessSelect = {
  id: true,
  workspaceId: true,
  name: true,
  slug: true,
} satisfies Prisma.ProjectSelect;

const attachmentAccessSelect = {
  id: true,
  storagePath: true,
  ticket: {
    select: ticketAccessSelect,
  },
} satisfies Prisma.TicketAttachmentSelect;

type TicketAccessLookup = {
  ticketId?: string;
  ticketCode?: string;
  workspaceId?: string;
};

export class AuthorizationError extends Error {
  status: number;

  constructor(message = "You do not have permission to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
    this.status = 403;
  }
}

async function resolveUserId(userId?: string) {
  if (userId) {
    return userId;
  }

  const user = await getCurrentUserOrThrow();
  return user.id;
}

function buildTicketLookupWhere(
  lookup: TicketAccessLookup
): Prisma.TicketWhereInput {
  if (!lookup.ticketId && !lookup.ticketCode) {
    throw new Error("Ticket access lookup requires a ticket id or ticket code.");
  }

  return {
    ...(lookup.ticketId ? { id: lookup.ticketId } : {}),
    ...(lookup.ticketCode ? { code: lookup.ticketCode } : {}),
    ...(lookup.workspaceId ? { workspaceId: lookup.workspaceId } : {}),
  };
}

export async function assertWorkspaceMember(
  workspaceId: string,
  userId?: string
) {
  const resolvedUserId = await resolveUserId(userId);

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        {
          ownerId: resolvedUserId,
        },
        {
          members: {
            some: {
              userId: resolvedUserId,
            },
          },
        },
      ],
    },
    select: {
      ...workspaceAccessSelect,
      members: {
        where: {
          userId: resolvedUserId,
        },
        select: {
          role: true,
        },
        take: 1,
      },
    },
  });

  if (!workspace) {
    throw new AuthorizationError("Workspace not found or access denied.");
  }

  return {
    userId: resolvedUserId,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
    },
    role:
      workspace.ownerId === resolvedUserId
        ? WorkspaceRole.OWNER
        : (workspace.members[0]?.role ?? WorkspaceRole.MEMBER),
  };
}

export async function assertCanAccessProject(projectId: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: projectAccessSelect,
  });

  if (!project) {
    throw new AuthorizationError("Project not found or access denied.");
  }

  const workspaceAccess = await assertWorkspaceMember(
    project.workspaceId,
    resolvedUserId
  );

  return {
    userId: resolvedUserId,
    project,
    workspaceAccess,
  };
}

export async function assertCanCreateTicket(
  workspaceId: string,
  projectId: string,
  userId?: string
) {
  const resolvedUserId = await resolveUserId(userId);
  const workspaceAccess = await assertWorkspaceMember(workspaceId, resolvedUserId);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
    },
    select: projectAccessSelect,
  });

  if (!project) {
    throw new AuthorizationError(
      "Project not found in the selected workspace."
    );
  }

  return {
    userId: resolvedUserId,
    project,
    workspaceAccess,
  };
}

export async function assertCanAccessTicket(
  lookup: TicketAccessLookup,
  userId?: string
) {
  const resolvedUserId = await resolveUserId(userId);
  const ticket = await prisma.ticket.findFirst({
    where: buildTicketLookupWhere(lookup),
    select: ticketAccessSelect,
  });

  if (!ticket) {
    throw new AuthorizationError("Ticket not found or access denied.");
  }

  const workspaceAccess = await assertWorkspaceMember(
    ticket.workspaceId,
    resolvedUserId
  );

  return {
    userId: resolvedUserId,
    ticket,
    workspaceAccess,
  };
}

export async function assertCanModifyTicket(
  lookup: TicketAccessLookup,
  userId?: string
) {
  return assertCanAccessTicket(lookup, userId);
}

export async function assertCanCommentOnTicket(
  lookup: TicketAccessLookup,
  userId?: string
) {
  return assertCanAccessTicket(lookup, userId);
}

export async function assertCanAccessTicketAttachment(
  attachmentId: string,
  userId?: string
) {
  const resolvedUserId = await resolveUserId(userId);
  const attachment = await prisma.ticketAttachment.findUnique({
    where: {
      id: attachmentId,
    },
    select: attachmentAccessSelect,
  });

  if (!attachment) {
    throw new AuthorizationError("Attachment not found or access denied.");
  }

  const workspaceAccess = await assertWorkspaceMember(
    attachment.ticket.workspaceId,
    resolvedUserId
  );

  return {
    userId: resolvedUserId,
    attachment,
    workspaceAccess,
  };
}
