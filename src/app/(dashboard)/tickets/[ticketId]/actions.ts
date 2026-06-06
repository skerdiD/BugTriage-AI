"use server";

import { revalidatePath } from "next/cache";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

import { AuthorizationError } from "@/lib/auth/authorization";
import {
  getCurrentUserOrThrow,
  getCurrentWorkspaceContextOrThrow,
} from "@/lib/auth/session";
import { DEMO_READ_ONLY_MESSAGE, isDemoUser } from "@/lib/demo";
import {
  addTicketComment,
  MAX_TICKET_COMMENT_LENGTH,
  updateTicketStatus,
} from "@/lib/data/tickets";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { ticketCodeSchema } from "@/lib/validation/resource-identifiers";

const commentSchema = z.object({
  ticketCode: ticketCodeSchema,
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(
      MAX_TICKET_COMMENT_LENGTH,
      `Comment must be ${MAX_TICKET_COMMENT_LENGTH.toLocaleString()} characters or less.`
    ),
});

const statusSchema = z.object({
  ticketCode: ticketCodeSchema,
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
    if (isDemoUser(user)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }

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

    if (
      error instanceof Error &&
      (error.message === "Comment body cannot be empty." ||
        error.message ===
          `Comment must be ${MAX_TICKET_COMMENT_LENGTH.toLocaleString()} characters or less.`)
    ) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "tickets",
      action: "add-comment",
      message: "[ticket-actions] add comment failed",
      context: {
        ticketCode: input.ticketCode,
      },
    });

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
    if (isDemoUser(user)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }

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

    captureServerException(error, {
      area: "tickets",
      action: "update-status",
      message: "[ticket-actions] update status failed",
      context: {
        ticketCode: input.ticketCode,
        status: String(input.status),
      },
    });

    return {
      ok: false as const,
      error: "We couldn't update that ticket status right now. Please try again.",
    };
  }
}
