import "server-only";

import { randomBytes } from "node:crypto";
import { InviteStatus, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

import {
  assertCanManageWorkspaceInvites,
  AuthorizationError,
  canInviteWorkspaceRole,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";

export const WORKSPACE_INVITE_EXPIRES_IN_DAYS = 7;
export const WORKSPACE_INVITE_TOKEN_MIN_LENGTH = 20;
export const WORKSPACE_INVITE_TOKEN_MAX_LENGTH = 128;

export const workspaceInviteTokenSchema = z
  .string()
  .trim()
  .min(WORKSPACE_INVITE_TOKEN_MIN_LENGTH, "This invite link is invalid.")
  .max(WORKSPACE_INVITE_TOKEN_MAX_LENGTH, "This invite link is invalid.")
  .regex(/^[A-Za-z0-9_-]+$/, "This invite link is invalid.");

export class WorkspaceInviteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceInviteError";
  }
}

export type WorkspaceInviteSummary = {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: InviteStatus;
  token: string;
  workspaceId: string;
  invitedById: string;
  invitedByName: string;
  invitedByEmail: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
};

export type WorkspaceInviteLookup = WorkspaceInviteSummary & {
  workspaceName: string;
  workspaceSlug: string;
};

function getInviteExpiryDate(now = new Date()) {
  return new Date(
    now.getTime() + WORKSPACE_INVITE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  );
}

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createWorkspaceInviteToken() {
  return randomBytes(32).toString("base64url");
}

function parseWorkspaceInviteToken(token: string) {
  const parsedToken = workspaceInviteTokenSchema.safeParse(token);

  return parsedToken.success ? parsedToken.data : null;
}

export function getInviteLifecycleStatus(invite: {
  status: InviteStatus;
  expiresAt: Date;
}) {
  if (
    invite.status === InviteStatus.PENDING &&
    invite.expiresAt.getTime() <= Date.now()
  ) {
    return InviteStatus.EXPIRED;
  }

  return invite.status;
}

async function expirePendingWorkspaceInvites(where?: {
  workspaceId?: string;
  token?: string;
}) {
  await prisma.workspaceInvite.updateMany({
    where: {
      status: InviteStatus.PENDING,
      expiresAt: {
        lte: new Date(),
      },
      ...(where?.workspaceId ? { workspaceId: where.workspaceId } : {}),
      ...(where?.token ? { token: where.token } : {}),
    },
    data: {
      status: InviteStatus.EXPIRED,
    },
  });
}

async function isEmailAlreadyInWorkspace(workspaceId: string, email: string) {
  const existingWorkspaceAccess = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        {
          owner: {
            email,
          },
        },
        {
          members: {
            some: {
              user: {
                email,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return Boolean(existingWorkspaceAccess);
}

function mapWorkspaceInviteSummary(invite: {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: InviteStatus;
  token: string;
  workspaceId: string;
  invitedById: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
}) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    token: invite.token,
    workspaceId: invite.workspaceId,
    invitedById: invite.invitedById,
    invitedByName: invite.invitedBy.name,
    invitedByEmail: invite.invitedBy.email,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    acceptedAt: invite.acceptedAt,
    revokedAt: invite.revokedAt,
  } satisfies WorkspaceInviteSummary;
}

export async function listPendingWorkspaceInvites(
  workspaceId: string,
  userId?: string
) {
  await assertCanManageWorkspaceInvites(workspaceId, userId);
  await expirePendingWorkspaceInvites({ workspaceId });

  const invites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      status: InviteStatus.PENDING,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      token: true,
      workspaceId: true,
      invitedById: true,
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      expiresAt: true,
      createdAt: true,
      acceptedAt: true,
      revokedAt: true,
    },
  });

  return invites.map((invite) => mapWorkspaceInviteSummary(invite));
}

export async function createWorkspaceInvite(input: {
  workspaceId: string;
  actorUserId?: string;
  email: string;
  role: WorkspaceRole;
}) {
  const access = await assertCanManageWorkspaceInvites(
    input.workspaceId,
    input.actorUserId
  );

  if (!canInviteWorkspaceRole(access.role, input.role)) {
    throw new AuthorizationError(
      access.role === WorkspaceRole.ADMIN
        ? "Workspace admins can only invite members."
        : "Only workspace owners can invite admins."
    );
  }

  const normalizedEmail = normalizeInviteEmail(input.email);

  if (!normalizedEmail) {
    throw new WorkspaceInviteError("Invite email is required.");
  }

  await expirePendingWorkspaceInvites({ workspaceId: input.workspaceId });

  if (await isEmailAlreadyInWorkspace(input.workspaceId, normalizedEmail)) {
    throw new WorkspaceInviteError("That user already belongs to this workspace.");
  }

  const existingPendingInvite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId: input.workspaceId,
      email: normalizedEmail,
      status: InviteStatus.PENDING,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (
    existingPendingInvite &&
    !canInviteWorkspaceRole(access.role, existingPendingInvite.role)
  ) {
    throw new AuthorizationError(
      "You do not have permission to replace that pending invite."
    );
  }

  const token = createWorkspaceInviteToken();
  const expiresAt = getInviteExpiryDate();

  const invite = existingPendingInvite
    ? await prisma.workspaceInvite.update({
        where: {
          id: existingPendingInvite.id,
        },
        data: {
          email: normalizedEmail,
          role: input.role,
          token,
          invitedById: access.userId,
          expiresAt,
          status: InviteStatus.PENDING,
          acceptedAt: null,
          revokedAt: null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          token: true,
          workspaceId: true,
          invitedById: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          expiresAt: true,
          createdAt: true,
          acceptedAt: true,
          revokedAt: true,
        },
      })
    : await prisma.workspaceInvite.create({
        data: {
          email: normalizedEmail,
          role: input.role,
          token,
          workspaceId: input.workspaceId,
          invitedById: access.userId,
          expiresAt,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          token: true,
          workspaceId: true,
          invitedById: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          expiresAt: true,
          createdAt: true,
          acceptedAt: true,
          revokedAt: true,
        },
      });

  return mapWorkspaceInviteSummary(invite);
}

export async function revokeWorkspaceInvite(input: {
  workspaceId: string;
  inviteId: string;
  actorUserId?: string;
}) {
  const access = await assertCanManageWorkspaceInvites(
    input.workspaceId,
    input.actorUserId
  );

  await expirePendingWorkspaceInvites({ workspaceId: input.workspaceId });

  const invite = await prisma.workspaceInvite.findFirst({
    where: {
      id: input.inviteId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!invite || invite.status !== InviteStatus.PENDING) {
    throw new WorkspaceInviteError("That invite is no longer pending.");
  }

  if (!canInviteWorkspaceRole(access.role, invite.role)) {
    throw new AuthorizationError(
      "You do not have permission to revoke that invite."
    );
  }

  await prisma.workspaceInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      status: InviteStatus.REVOKED,
      revokedAt: new Date(),
    },
  });
}

export async function getWorkspaceInviteByToken(token: string) {
  const normalizedToken = parseWorkspaceInviteToken(token);

  if (!normalizedToken) {
    return null;
  }

  await expirePendingWorkspaceInvites({ token: normalizedToken });

  const invite = await prisma.workspaceInvite.findUnique({
    where: {
      token: normalizedToken,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      token: true,
      workspaceId: true,
      invitedById: true,
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      workspace: {
        select: {
          name: true,
          slug: true,
        },
      },
      expiresAt: true,
      createdAt: true,
      acceptedAt: true,
      revokedAt: true,
    },
  });

  if (!invite) {
    return null;
  }

  return {
    ...mapWorkspaceInviteSummary(invite),
    workspaceName: invite.workspace.name,
    workspaceSlug: invite.workspace.slug,
  } satisfies WorkspaceInviteLookup;
}

export async function acceptWorkspaceInvite(input: {
  token: string;
  authUserId: string;
  authUserEmail: string;
}) {
  const normalizedToken = parseWorkspaceInviteToken(input.token);
  const normalizedEmail = normalizeInviteEmail(input.authUserEmail);

  if (!normalizedToken) {
    return {
      ok: false as const,
      error: "This invite link is invalid.",
    };
  }

  if (!normalizedEmail) {
    return {
      ok: false as const,
      error: "You must be signed in with the invited email address.",
    };
  }

  await expirePendingWorkspaceInvites({ token: normalizedToken });

  const invite = await prisma.workspaceInvite.findUnique({
    where: {
      token: normalizedToken,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      workspaceId: true,
      expiresAt: true,
    },
  });

  if (!invite) {
    return {
      ok: false as const,
      error: "This invite link is invalid or no longer available.",
    };
  }

  const lifecycleStatus = getInviteLifecycleStatus(invite);

  if (lifecycleStatus === InviteStatus.REVOKED) {
    return {
      ok: false as const,
      error: "This invite has been revoked.",
    };
  }

  if (lifecycleStatus === InviteStatus.EXPIRED) {
    return {
      ok: false as const,
      error: "This invite has expired. Ask the workspace owner or admin for a new link.",
    };
  }

  if (lifecycleStatus === InviteStatus.ACCEPTED) {
    return {
      ok: false as const,
      error: "This invite has already been accepted.",
    };
  }

  if (normalizeInviteEmail(invite.email) !== normalizedEmail) {
    return {
      ok: false as const,
      error:
        "This invite was sent to a different email address. Sign in with the invited email to continue.",
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentInvite = await tx.workspaceInvite.findUnique({
      where: {
        id: invite.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        workspaceId: true,
        expiresAt: true,
      },
    });

    if (!currentInvite) {
      return {
        ok: false as const,
        error: "This invite link is invalid or no longer available.",
      };
    }

    const currentStatus = getInviteLifecycleStatus(currentInvite);

    if (currentStatus !== InviteStatus.PENDING) {
      return {
        ok: false as const,
        error:
          currentStatus === InviteStatus.ACCEPTED
            ? "This invite has already been accepted."
            : currentStatus === InviteStatus.REVOKED
              ? "This invite has been revoked."
              : "This invite has expired. Ask the workspace owner or admin for a new link.",
      };
    }

    const existingMembership = await tx.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: input.authUserId,
          workspaceId: currentInvite.workspaceId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingMembership) {
      await tx.workspaceMember.create({
        data: {
          userId: input.authUserId,
          workspaceId: currentInvite.workspaceId,
          role: currentInvite.role,
        },
      });
    }

    await tx.workspaceInvite.update({
      where: {
        id: currentInvite.id,
      },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    const firstProject = await tx.project.findFirst({
      where: {
        workspaceId: currentInvite.workspaceId,
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      select: {
        id: true,
      },
    });

    return {
      ok: true as const,
      workspaceId: currentInvite.workspaceId,
      projectId: firstProject?.id ?? null,
      alreadyMember: Boolean(existingMembership),
    };
  });

  return result;
}
