import "server-only";

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildTicketEmbeddingInput,
  hashTicketEmbeddingContent,
  TICKET_EMBEDDING_MODEL,
  TICKET_EMBEDDING_PROVIDER,
} from "@/lib/ai/ticket-embeddings";
import { createAndStoreTicketEmbedding } from "@/lib/data/similar-issues";
import { prisma } from "@/lib/prisma";
import { getSafeErrorMessage } from "@/lib/security/redaction";

export type TicketEmbeddingBackfillResult = {
  failed: number;
  scanned: number;
  skipped: number;
  stored: number;
};

export async function backfillTicketEmbeddings(input: {
  ticketIds?: string[];
} = {}): Promise<TicketEmbeddingBackfillResult> {
  const tickets = await prisma.ticket.findMany({
    where: {
      ...(input.ticketIds ? { id: { in: input.ticketIds } } : {}),
      aiAnalysis: { isNot: null },
    },
    select: {
      id: true,
      code: true,
      workspaceId: true,
      projectId: true,
      title: true,
      description: true,
      expectedBehavior: true,
      actualBehavior: true,
      stepsToReproduce: true,
      browser: true,
      device: true,
      environment: true,
      affectedPage: true,
      aiAnalysis: {
        select: { summary: true },
      },
      embedding: {
        select: {
          contentHash: true,
          model: true,
          provider: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result: TicketEmbeddingBackfillResult = {
    failed: 0,
    scanned: tickets.length,
    skipped: 0,
    stored: 0,
  };

  for (const ticket of tickets) {
    const source = {
      title: ticket.title,
      description: ticket.description,
      expectedBehavior: ticket.expectedBehavior,
      actualBehavior: ticket.actualBehavior,
      stepsToReproduce: ticket.stepsToReproduce,
      browser: ticket.browser,
      device: ticket.device,
      environment: ticket.environment,
      affectedPage: ticket.affectedPage,
      aiSummary: ticket.aiAnalysis?.summary,
    };
    const expectedHash = hashTicketEmbeddingContent(
      buildTicketEmbeddingInput(source)
    );

    if (
      ticket.embedding?.contentHash === expectedHash &&
      ticket.embedding.provider === TICKET_EMBEDDING_PROVIDER &&
      ticket.embedding.model === TICKET_EMBEDDING_MODEL
    ) {
      result.skipped += 1;
      continue;
    }

    try {
      const stored = await createAndStoreTicketEmbedding({
        ticketId: ticket.id,
        workspaceId: ticket.workspaceId,
        projectId: ticket.projectId,
        source,
      });

      result[stored.stored ? "stored" : "skipped"] += 1;
    } catch (error) {
      result.failed += 1;
      console.error(
        `[embedding-backfill] ${ticket.code}: ${getSafeErrorMessage(error)}`
      );
    }
  }

  return result;
}

const executedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const currentFilePath = fileURLToPath(import.meta.url);

if (executedScriptPath === currentFilePath) {
  backfillTicketEmbeddings()
    .then((result) => {
      console.info(`[embedding-backfill] ${JSON.stringify(result)}`);

      if (result.failed > 0) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error("Ticket embedding backfill failed.");
      console.error(getSafeErrorMessage(error));
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
