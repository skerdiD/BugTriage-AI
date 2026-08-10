"use server";

import { request as getArcjetRequest } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { AiAnalysisFeedback, TicketStatus } from "@prisma/client";
import { z } from "zod";

import { getPublicAiTriageFailureMessage } from "@/lib/ai/bug-triage";
import { AuthorizationError } from "@/lib/auth/authorization";
import {
  getCurrentUserOrThrow,
  getCurrentWorkspaceContextOrThrow,
} from "@/lib/auth/session";
import {
  DEMO_READ_ONLY_MESSAGE,
  isDemoTicketCode,
  isDemoUser,
} from "@/lib/demo";
import {
  addTicketComment,
  getTicketByCode,
  MAX_TICKET_COMMENT_LENGTH,
  setTicketAiAnalysisFeedback,
  updateTicketStatus,
} from "@/lib/data/tickets";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { dispatchTicketAnalysis } from "@/lib/queue/dispatch-ticket-analysis";
import {
  bugSubmissionProtection,
  getArcjetDeniedMessage,
  logArcjetError,
} from "@/lib/security/arcjet";
import {
  resourceIdSchema,
  ticketCodeSchema,
} from "@/lib/validation/resource-identifiers";

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

const regenerateSchema = z.object({
  ticketCode: ticketCodeSchema,
});

const feedbackSchema = z.object({
  ticketCode: ticketCodeSchema,
  analysisRunId: resourceIdSchema,
  feedback: z.nativeEnum(AiAnalysisFeedback),
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

export async function regenerateTicketAiAnalysisAction(input: {
  ticketCode: string;
}) {
  try {
    const parsed = regenerateSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "That AI regeneration request was invalid." };
    }

    const [user, context] = await Promise.all([
      getCurrentUserOrThrow(),
      getCurrentWorkspaceContextOrThrow(),
    ]);

    if (isDemoUser(user) || isDemoTicketCode(parsed.data.ticketCode)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }

    const arcjetRequest = await getArcjetRequest();
    const arcjetDecision = await bugSubmissionProtection.protect(arcjetRequest, {
      userId: user.id,
    });

    logArcjetError("regenerate-ticket-ai-analysis", arcjetDecision);

    if (arcjetDecision.isDenied()) {
      return {
        ok: false as const,
        error: getArcjetDeniedMessage(
          arcjetDecision,
          "AI regeneration blocked by application security."
        ),
      };
    }

    const ticket = await getTicketByCode(
      parsed.data.ticketCode,
      context.workspace.id
    );

    if (!ticket) {
      return { ok: false as const, error: "Ticket was not found." };
    }

    const dispatch = await dispatchTicketAnalysis({
      ticketId: ticket.id,
      requestedById: user.id,
    });

    revalidateTicketViews(ticket.code);

    return {
      ok: true as const,
      message:
        dispatch.mode === "queued"
          ? "AI analysis was queued and will update shortly."
          : "AI analysis regenerated and the previous run was preserved.",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }

    return {
      ok: false as const,
      error: getPublicAiTriageFailureMessage(error),
    };
  }
}

export async function setTicketAiAnalysisFeedbackAction(input: {
  ticketCode: string;
  analysisRunId: string;
  feedback: AiAnalysisFeedback;
}) {
  try {
    const parsed = feedbackSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "That AI feedback request was invalid." };
    }

    const [user, context] = await Promise.all([
      getCurrentUserOrThrow(),
      getCurrentWorkspaceContextOrThrow(),
    ]);

    if (isDemoUser(user)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }

    await setTicketAiAnalysisFeedback({
      workspaceId: context.workspace.id,
      ticketCode: parsed.data.ticketCode,
      analysisRunId: parsed.data.analysisRunId,
      feedback: parsed.data.feedback,
    });

    revalidatePath(`/tickets/${parsed.data.ticketCode}`);

    return { ok: true as const, message: "AI feedback saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }

    captureServerException(error, {
      area: "ai-triage",
      action: "set-ticket-ai-feedback",
      message: "[ticket-actions] AI feedback failed",
      context: {
        ticketCode: input.ticketCode,
        analysisRunId: input.analysisRunId,
      },
    });

    return {
      ok: false as const,
      error: "We couldn't save that AI feedback right now. Please try again.",
    };
  }
}
