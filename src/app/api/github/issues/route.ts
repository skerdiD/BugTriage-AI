import { AuthorizationError } from "@/lib/auth/authorization";
import {
  AuthenticationError,
  getCurrentWorkspaceContextOrThrow,
} from "@/lib/auth/session";
import { getTicketByCode } from "@/lib/data/tickets";
import {
  exportTicketToGitHubIssue,
  githubIssueExportSchema,
} from "@/lib/integrations/github-issues";
import { captureServerException } from "@/lib/observability/server-monitoring";
import {
  getArcjetDeniedMessage,
  githubIssueExportProtection,
  logArcjetError,
} from "@/lib/security/arcjet";

const MAX_GITHUB_EXPORT_REQUEST_BYTES = 8 * 1024;

class RequestBodyError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

async function readJsonBodyWithLimit(request: Request) {
  const contentLengthHeader = request.headers.get("content-length");

  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);

    if (!Number.isFinite(contentLength) || contentLength < 0) {
      throw new RequestBodyError("Invalid export request.", 400);
    }

    if (contentLength > MAX_GITHUB_EXPORT_REQUEST_BYTES) {
      throw new RequestBodyError("Export request is too large.", 413);
    }
  }

  if (!request.body) {
    throw new RequestBodyError("Invalid export request.", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > MAX_GITHUB_EXPORT_REQUEST_BYTES) {
      throw new RequestBodyError("Export request is too large.", 413);
    }

    chunks.push(value);
  }

  const bodyBuffer = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bodyBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const bodyText = new TextDecoder().decode(bodyBuffer);

  if (!bodyText.trim()) {
    throw new RequestBodyError("Invalid export request.", 400);
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    throw new RequestBodyError("Invalid export request.", 400);
  }
}

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof getCurrentWorkspaceContextOrThrow>>;
  let body: unknown;

  try {
    context = await getCurrentWorkspaceContextOrThrow();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json(
        { ok: false, error: "You must be signed in before exporting tickets." },
        { status: 401 }
      );
    }

    captureServerException(error, {
      area: "integrations",
      action: "github-issue-export-auth",
      message: "[github-export] failed to resolve workspace context",
    });

    return Response.json(
      { ok: false, error: "We couldn't export this ticket right now." },
      { status: 500 }
    );
  }

  const arcjetDecision = await githubIssueExportProtection
    .protect(request.clone(), {
      userId: context.user.id,
    })
    .catch((error) => {
      captureServerException(error, {
        area: "integrations",
        action: "github-issue-export-protection",
        message: "[github-export] request protection failed",
        context: {
          userId: context.user.id,
        },
      });

      return null;
    });

  if (!arcjetDecision) {
    return Response.json(
      { ok: false, error: "We couldn't export this ticket right now." },
      { status: 500 }
    );
  }

  logArcjetError("github-issue-export", arcjetDecision);

  if (arcjetDecision.isDenied()) {
    return Response.json(
      {
        ok: false,
        error: getArcjetDeniedMessage(
          arcjetDecision,
          "GitHub issue export blocked by application security."
        ),
      },
      {
        status: arcjetDecision.reason.isRateLimit() ? 429 : 403,
      }
    );
  }

  try {
    body = await readJsonBodyWithLimit(request);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json(
        { ok: false, error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { ok: false, error: "Invalid export request." },
      { status: 400 }
    );
  }

  const parsed = githubIssueExportSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Check the GitHub repository details and token.",
      },
      { status: 400 }
    );
  }

  try {
    const ticket = await getTicketByCode(
      parsed.data.ticketCode,
      context.workspace.id
    );

    if (!ticket) {
      return Response.json(
        { ok: false, error: "Ticket was not found." },
        { status: 404 }
      );
    }

    const result = await exportTicketToGitHubIssue(parsed.data, ticket);

    return Response.json({
      ok: true,
      issueUrl: result.issueUrl,
      issueNumber: result.issueNumber,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json({ ok: false, error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.startsWith("GitHub ")) {
      return Response.json({ ok: false, error: error.message }, { status: 502 });
    }

    captureServerException(error, {
      area: "integrations",
      action: "github-issue-export",
      message: "[github-export] failed to export ticket",
      context: {
        ticketCode: parsed.data.ticketCode,
        owner: parsed.data.owner,
        repo: parsed.data.repo,
      },
    });

    return Response.json(
      { ok: false, error: "We couldn't export this ticket right now." },
      { status: 500 }
    );
  }
}
