"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

import { AuthorizationError } from "@/lib/auth/authorization";
import {
  getCurrentUserOrThrow,
  getCurrentWorkspaceContextOrThrow,
} from "@/lib/auth/session";
import { addTicketComment, updateTicketStatus } from "@/lib/data/tickets";
import { getSafeErrorMessage } from "@/lib/security/redaction";

const commentSchema = z.object({
  ticketCode: z.string().trim().min(1),
  body: z.string().trim().min(1, "Comment cannot be empty."),
});

const statusSchema = z.object({
  ticketCode: z.string().trim().min(1),
  status: z.nativeEnum(TicketStatus),
});

function revalidateTicketViews(ticketCode: string) {
  revalidatePath(`/tickets/${ticketCode}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function addTicketCommentAction(input: {
  ticketCode: string;
  body: string;
}) {
  try {
    const parsed = commentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error:
          parsed.error.issues[0]?.message ??
          "Comment could not be submitted. Please try again.",
      };
    }

    const [user, context] = await Promise.all([
      getCurrentUserOrThrow(),
      getCurrentWorkspaceContextOrThrow(),
    ]);

    await addTicketComment({
      workspaceId: context.workspace.id,
      ticketCode: parsed.data.ticketCode,
      authorId: user.id,
      body: parsed.data.body,
    });

    revalidateTicketViews(parsed.data.ticketCode);

    return {
      ok: true as const,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    if (error instanceof Error && error.message === "Comment body cannot be empty.") {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    Sentry.captureException(error, {
      tags: {
        area: "tickets",
        action: "add-comment",
      },
      extra: {
        ticketCode: input.ticketCode,
      },
    });
    console.error(
      "[ticket-actions] add comment failed",
      getSafeErrorMessage(error)
    );

    return {
      ok: false as const,
      error: "We couldn't save that comment right now. Please try again.",
    };
  }
}

export async function updateTicketStatusAction(input: {
  ticketCode: string;
  status: TicketStatus;
}) {
  try {
    const parsed = statusSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: "That status update was invalid. Please refresh and try again.",
      };
    }

    const [user, context] = await Promise.all([
      getCurrentUserOrThrow(),
      getCurrentWorkspaceContextOrThrow(),
    ]);

    await updateTicketStatus(
      parsed.data.ticketCode,
      context.workspace.id,
      parsed.data.status,
      user.id
    );

    revalidateTicketViews(parsed.data.ticketCode);

    return {
      ok: true as const,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    Sentry.captureException(error, {
      tags: {
        area: "tickets",
        action: "update-status",
      },
      extra: {
        ticketCode: input.ticketCode,
        status: input.status,
      },
    });
    console.error(
      "[ticket-actions] update status failed",
      getSafeErrorMessage(error)
    );

    return {
      ok: false as const,
      error: "We couldn't update that ticket status right now. Please try again.",
    };
  }
}
