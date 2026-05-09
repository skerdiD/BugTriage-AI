"use server";

import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

import { AuthorizationError } from "@/lib/auth/authorization";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import {
  createWorkspaceInvite,
  revokeWorkspaceInvite,
  WorkspaceInviteError,
} from "@/lib/data/workspace-invites";
import {
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  WorkspaceManagementError,
} from "@/lib/data/workspaces";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { buildAppUrl } from "@/lib/security/app-url";

const inviteInputSchema = z.object({
  workspaceId: z.string().trim().min(1),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address."),
  role: z.nativeEnum(WorkspaceRole),
});

const revokeInviteInputSchema = z.object({
  workspaceId: z.string().trim().min(1),
  inviteId: z.string().trim().min(1),
});

const updateMemberRoleInputSchema = z.object({
  workspaceId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
  role: z.nativeEnum(WorkspaceRole),
});

const removeMemberInputSchema = z.object({
  workspaceId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});

export async function createWorkspaceInviteAction(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}) {
  try {
    const user = await getCurrentUserOrThrow();
    const parsed = inviteInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error:
          parsed.error.issues[0]?.message ??
          "Please review the invite details and try again.",
      };
    }

    const invite = await createWorkspaceInvite({
      workspaceId: parsed.data.workspaceId,
      actorUserId: user.id,
      email: parsed.data.email,
      role: parsed.data.role,
    });

    return {
      ok: true as const,
      inviteLink: await buildAppUrl(`/invite/${invite.token}`),
      message: `Invite ready for ${invite.email}. Share the link anywhere you coordinate with your team.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    if (error instanceof WorkspaceInviteError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "workspace",
      action: "create-invite",
      message: "[team-actions] create invite failed",
      context: {
        workspaceId: input.workspaceId,
        role: String(input.role),
      },
    });

    return {
      ok: false as const,
      error: "We couldn't create that invite right now. Please try again.",
    };
  }
}

export async function revokeWorkspaceInviteAction(input: {
  workspaceId: string;
  inviteId: string;
}) {
  try {
    const user = await getCurrentUserOrThrow();
    const parsed = revokeInviteInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: "That invite request was invalid. Please refresh and try again.",
      };
    }

    await revokeWorkspaceInvite({
      workspaceId: parsed.data.workspaceId,
      inviteId: parsed.data.inviteId,
      actorUserId: user.id,
    });

    return {
      ok: true as const,
      message: "Invite revoked.",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    if (error instanceof WorkspaceInviteError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "workspace",
      action: "revoke-invite",
      message: "[team-actions] revoke invite failed",
      context: {
        workspaceId: input.workspaceId,
      },
    });

    return {
      ok: false as const,
      error: "We couldn't revoke that invite right now. Please try again.",
    };
  }
}

export async function updateWorkspaceMemberRoleAction(input: {
  workspaceId: string;
  memberId: string;
  role: WorkspaceRole;
}) {
  try {
    const user = await getCurrentUserOrThrow();
    const parsed = updateMemberRoleInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: "That role update request was invalid. Please refresh and try again.",
      };
    }

    const updatedMember = await updateWorkspaceMemberRole({
      workspaceId: parsed.data.workspaceId,
      memberId: parsed.data.memberId,
      nextRole: parsed.data.role,
      actorUserId: user.id,
    });

    return {
      ok: true as const,
      message: `${updatedMember.memberName} is now ${updatedMember.role}.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    if (error instanceof WorkspaceManagementError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "workspace",
      action: "update-member-role",
      message: "[team-actions] update member role failed",
      context: {
        workspaceId: input.workspaceId,
        memberId: input.memberId,
        role: String(input.role),
      },
    });

    return {
      ok: false as const,
      error: "We couldn't update that teammate right now. Please try again.",
    };
  }
}

export async function removeWorkspaceMemberAction(input: {
  workspaceId: string;
  memberId: string;
}) {
  try {
    const user = await getCurrentUserOrThrow();
    const parsed = removeMemberInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: "That remove-member request was invalid. Please refresh and try again.",
      };
    }

    const removedMember = await removeWorkspaceMember({
      workspaceId: parsed.data.workspaceId,
      memberId: parsed.data.memberId,
      actorUserId: user.id,
    });

    return {
      ok: true as const,
      message: `${removedMember.memberName} was removed from the workspace.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    if (error instanceof WorkspaceManagementError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "workspace",
      action: "remove-member",
      message: "[team-actions] remove member failed",
      context: {
        workspaceId: input.workspaceId,
        memberId: input.memberId,
      },
    });

    return {
      ok: false as const,
      error: "We couldn't remove that teammate right now. Please try again.",
    };
  }
}
