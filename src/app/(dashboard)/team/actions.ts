"use server";

import * as Sentry from "@sentry/nextjs";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

import { AuthorizationError } from "@/lib/auth/authorization";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import {
  createWorkspaceInvite,
  revokeWorkspaceInvite,
  WorkspaceInviteError,
} from "@/lib/data/workspace-invites";
import { buildAppUrl } from "@/lib/security/app-url";
import { getSafeErrorMessage } from "@/lib/security/redaction";

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

    Sentry.captureException(error, {
      tags: {
        area: "workspace",
        action: "create-invite",
      },
      extra: {
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });
    console.error(
      "[team-actions] create invite failed",
      getSafeErrorMessage(error)
    );

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

    Sentry.captureException(error, {
      tags: {
        area: "workspace",
        action: "revoke-invite",
      },
      extra: {
        workspaceId: input.workspaceId,
      },
    });
    console.error(
      "[team-actions] revoke invite failed",
      getSafeErrorMessage(error)
    );

    return {
      ok: false as const,
      error: "We couldn't revoke that invite right now. Please try again.",
    };
  }
}
