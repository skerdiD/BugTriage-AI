"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { DEMO_READ_ONLY_MESSAGE, isDemoUser } from "@/lib/demo";
import { PROJECT_COOKIE_NAME, WORKSPACE_COOKIE_NAME } from "@/lib/data/workspaces";
import {
  acceptWorkspaceInvite,
  workspaceInviteTokenSchema,
} from "@/lib/data/workspace-invites";
import { ensureUserWorkspace } from "@/lib/data/workspaces";
import { captureServerException } from "@/lib/observability/server-monitoring";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const acceptInviteInputSchema = z.object({
  token: workspaceInviteTokenSchema,
});

function normalizeNameFromUserMetadata(
  metadata: Record<string, unknown> | undefined
) {
  const fullName = metadata?.full_name;
  const name = metadata?.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;

  return null;
}

export async function acceptWorkspaceInviteAction(input: { token: string }) {
  try {
    const user = await getCurrentUserOrThrow();
    if (isDemoUser(user)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }
    const parsed = acceptInviteInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error:
          parsed.error.issues[0]?.message ??
          "This invite link is invalid. Please request a fresh one.",
      };
    }

    if (!user.email) {
      return {
        ok: false as const,
        error: "Your account needs an email address before it can accept invites.",
      };
    }

    await ensureUserWorkspace({
      authUserId: user.id,
      email: user.email,
      name: normalizeNameFromUserMetadata(
        user.user_metadata as Record<string, unknown> | undefined
      ),
    });

    const result = await acceptWorkspaceInvite({
      token: parsed.data.token,
      authUserId: user.id,
      authUserEmail: user.email,
    });

    if (!result.ok) {
      return result;
    }

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, result.workspaceId, cookieOptions);

    if (result.projectId) {
      cookieStore.set(PROJECT_COOKIE_NAME, result.projectId, cookieOptions);
    } else {
      cookieStore.delete(PROJECT_COOKIE_NAME);
    }

    return {
      ok: true as const,
      alreadyMember: result.alreadyMember,
      message: result.alreadyMember
        ? "You already had access to this workspace, so we switched you into it."
        : "Invite accepted. Your workspace access is ready.",
    };
  } catch (error) {
    captureServerException(error, {
      area: "workspace",
      action: "accept-invite",
      message: "[invite-actions] accept invite failed",
      context: {
        hasToken: Boolean(input.token),
      },
    });

    return {
      ok: false as const,
      error: "We couldn't accept that invite right now. Please try again.",
    };
  }
}
