import "server-only";

import { randomUUID } from "crypto";

import { Prisma, TicketSeverity, TicketStatus } from "@prisma/client";

import {
  generateTicketEmbedding,
  TICKET_EMBEDDING_DIMENSIONS,
  type TicketEmbeddingSource,
} from "@/lib/ai/ticket-embeddings";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { prisma } from "@/lib/prisma";

export const SIMILAR_ISSUE_LIMIT = 3;
export const SIMILAR_ISSUE_MIN_SCORE = 0.74;

export type SimilarIssue = {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  severity: TicketSeverity;
  priorityScore: number | null;
  similarityScore: number;
};

type SimilarIssueRow = {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  severity: TicketSeverity;
  priorityScore: number | null;
  similarity: number;
};

function assertEmbeddingVector(embedding: number[]) {
  if (embedding.length !== TICKET_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${TICKET_EMBEDDING_DIMENSIONS} embedding dimensions, received ${embedding.length}.`
    );
  }

  if (!embedding.every(Number.isFinite)) {
    throw new Error("Ticket embedding contains non-finite values.");
  }
}

export function toPgVectorLiteral(embedding: number[]) {
  assertEmbeddingVector(embedding);
  return `[${embedding.map((value) => value.toFixed(8)).join(",")}]`;
}

export function mapSimilarIssueRows(
  rows: SimilarIssueRow[],
  currentTicketId: string
): SimilarIssue[] {
  return rows
    .filter((row) => row.id !== currentTicketId)
    .map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      status: row.status,
      severity: row.severity,
      priorityScore: row.priorityScore,
      similarityScore: Math.max(0, Math.min(1, Number(row.similarity))),
    }));
}

export async function createAndStoreTicketEmbedding(input: {
  ticketId: string;
  workspaceId: string;
  projectId: string;
  source: TicketEmbeddingSource;
}) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
    },
    select: {
      id: true,
    },
  });

  if (!ticket) {
    throw new Error(
      "Ticket embedding target was not found in the selected workspace project."
    );
  }

  const generated = await generateTicketEmbedding(input.source);
  const vectorLiteral = toPgVectorLiteral(generated.embedding);
  const existing = await prisma.$queryRaw<Array<{ contentHash: string }>>`
    SELECT "contentHash"
    FROM "public"."TicketEmbedding"
    WHERE "ticketId" = ${input.ticketId}
    LIMIT 1
  `;

  if (existing[0]?.contentHash === generated.contentHash) {
    return {
      stored: false,
      contentHash: generated.contentHash,
    };
  }

  await prisma.$executeRaw`
    INSERT INTO "public"."TicketEmbedding" (
      "id",
      "ticketId",
      "workspaceId",
      "projectId",
      "provider",
      "model",
      "contentHash",
      "embedding",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${input.ticketId},
      ${input.workspaceId},
      ${input.projectId},
      ${generated.provider},
      ${generated.model},
      ${generated.contentHash},
      ${vectorLiteral}::vector(768),
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("ticketId") DO UPDATE SET
      "workspaceId" = EXCLUDED."workspaceId",
      "projectId" = EXCLUDED."projectId",
      "provider" = EXCLUDED."provider",
      "model" = EXCLUDED."model",
      "contentHash" = EXCLUDED."contentHash",
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = CURRENT_TIMESTAMP
  `;

  return {
    stored: true,
    contentHash: generated.contentHash,
  };
}

export async function findSimilarIssuesForTicket(input: {
  ticketId: string;
  workspaceId: string;
  projectId: string;
  limit?: number;
  minScore?: number;
}): Promise<SimilarIssue[]> {
  try {
    const currentEmbedding = await prisma.$queryRaw<Array<{ embedding: string }>>`
      SELECT te."embedding"::text AS "embedding"
      FROM "public"."TicketEmbedding" te
      INNER JOIN "public"."Ticket" t ON t."id" = te."ticketId"
      WHERE te."ticketId" = ${input.ticketId}
        AND te."workspaceId" = ${input.workspaceId}
        AND t."workspaceId" = ${input.workspaceId}
      LIMIT 1
    `;

    const vectorLiteral = currentEmbedding[0]?.embedding;

    if (!vectorLiteral) {
      return [];
    }

    const limit = Math.min(Math.max(input.limit ?? SIMILAR_ISSUE_LIMIT, 1), 10);
    const minScore = input.minScore ?? SIMILAR_ISSUE_MIN_SCORE;
    const rows = await prisma.$queryRaw<SimilarIssueRow[]>(Prisma.sql`
      WITH current_embedding AS (
        SELECT ${vectorLiteral}::vector(768) AS embedding
      )
      SELECT
        t."id",
        t."code",
        t."title",
        t."status",
        t."severity",
        t."priorityScore",
        (1 - (te."embedding" <=> current_embedding.embedding))::double precision AS "similarity"
      FROM "public"."TicketEmbedding" te
      INNER JOIN "public"."Ticket" t ON t."id" = te."ticketId"
      CROSS JOIN current_embedding
      WHERE te."workspaceId" = ${input.workspaceId}
        AND t."workspaceId" = ${input.workspaceId}
        AND te."ticketId" <> ${input.ticketId}
        AND (1 - (te."embedding" <=> current_embedding.embedding)) >= ${minScore}
      ORDER BY
        CASE WHEN te."projectId" = ${input.projectId} THEN 0 ELSE 1 END ASC,
        te."embedding" <=> current_embedding.embedding ASC
      LIMIT ${limit}
    `);

    return mapSimilarIssueRows(rows, input.ticketId);
  } catch (error) {
    captureServerException(error, {
      area: "database",
      action: "find-similar-issues",
      message: "[similar-issues] failed to load similar tickets",
      context: {
        ticketId: input.ticketId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
      },
    });

    return [];
  }
}
