import "server-only";

import { randomUUID } from "crypto";

import { Prisma, TicketSeverity, TicketStatus } from "@prisma/client";

import {
  buildTicketEmbeddingInput,
  generateTicketEmbedding,
  hashTicketEmbeddingContent,
  TICKET_EMBEDDING_DIMENSIONS,
  TICKET_EMBEDDING_MODEL,
  TICKET_EMBEDDING_PROVIDER,
  type TicketEmbeddingSource,
} from "@/lib/ai/ticket-embeddings";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { prisma } from "@/lib/prisma";

export const SIMILAR_ISSUE_LIMIT = 3;
export const SIMILAR_ISSUE_MIN_SCORE = 0.85;
const SIMILAR_ISSUE_MAX_LIMIT = 10;
const SIMILAR_ISSUE_CANDIDATE_MULTIPLIER = 10;
const SIMILAR_ISSUE_MIN_CANDIDATES = 30;

export type SimilarIssue = {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  severity: TicketSeverity;
  priorityScore: number | null;
  similarityScore: number;
};

export type SimilarIssueSearchStatus =
  | "ready"
  | "not_indexed"
  | "unavailable";

export type SimilarIssueSearchResult = {
  issues: SimilarIssue[];
  status: SimilarIssueSearchStatus;
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

type StoredTicketEmbedding = {
  embedding: string;
  model: string;
  provider: string;
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

async function hasTicketEmbeddingTable() {
  const result = await prisma.$queryRaw<Array<{ tableName: string | null }>>`
    SELECT to_regclass('public."TicketEmbedding"')::text AS "tableName"
  `;

  return Boolean(result[0]?.tableName);
}

export function toPgVectorLiteral(embedding: number[]) {
  assertEmbeddingVector(embedding);
  return `[${embedding.map((value) => value.toFixed(8)).join(",")}]`;
}

function normalizeSearchLimit(limit?: number) {
  if (limit === undefined || !Number.isFinite(limit)) {
    return SIMILAR_ISSUE_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), SIMILAR_ISSUE_MAX_LIMIT);
}

function normalizeMinScore(minScore?: number) {
  if (minScore === undefined || !Number.isFinite(minScore)) {
    return SIMILAR_ISSUE_MIN_SCORE;
  }

  return Math.min(Math.max(minScore, 0), 1);
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

  if (!(await hasTicketEmbeddingTable())) {
    throw new Error(
      "Ticket embeddings table is not available. Run the latest Prisma migration."
    );
  }

  const content = buildTicketEmbeddingInput(input.source);

  if (!content) {
    throw new Error("Ticket embedding input is empty.");
  }

  const contentHash = hashTicketEmbeddingContent(content);
  const existing = await prisma.$queryRaw<
    Array<{ contentHash: string; model: string; provider: string }>
  >`
    SELECT "contentHash", "model", "provider"
    FROM "public"."TicketEmbedding"
    WHERE "ticketId" = ${input.ticketId}
    LIMIT 1
  `;

  if (
    existing[0]?.contentHash === contentHash &&
    existing[0]?.provider === TICKET_EMBEDDING_PROVIDER &&
    existing[0]?.model === TICKET_EMBEDDING_MODEL
  ) {
    return {
      stored: false,
      contentHash,
    };
  }

  const generated = await generateTicketEmbedding(input.source);
  const vectorLiteral = toPgVectorLiteral(generated.embedding);

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

export async function searchSimilarIssuesForTicket(input: {
  ticketId: string;
  workspaceId: string;
  projectId: string;
  limit?: number;
  minScore?: number;
}): Promise<SimilarIssueSearchResult> {
  try {
    if (!(await hasTicketEmbeddingTable())) {
      return { issues: [], status: "unavailable" };
    }

    const currentEmbedding = await prisma.$queryRaw<StoredTicketEmbedding[]>`
      SELECT
        te."embedding"::text AS "embedding",
        te."model",
        te."provider"
      FROM "public"."TicketEmbedding" te
      INNER JOIN "public"."Ticket" t
        ON t."id" = te."ticketId"
        AND t."workspaceId" = te."workspaceId"
        AND t."projectId" = te."projectId"
      WHERE te."ticketId" = ${input.ticketId}
        AND te."workspaceId" = ${input.workspaceId}
        AND te."projectId" = ${input.projectId}
        AND t."workspaceId" = ${input.workspaceId}
        AND t."projectId" = ${input.projectId}
      LIMIT 1
    `;

    const current = currentEmbedding[0];

    if (
      !current?.embedding ||
      current.provider !== TICKET_EMBEDDING_PROVIDER ||
      current.model !== TICKET_EMBEDDING_MODEL
    ) {
      return { issues: [], status: "not_indexed" };
    }

    const limit = normalizeSearchLimit(input.limit);
    const minScore = normalizeMinScore(input.minScore);
    const candidateLimit = Math.min(
      Math.max(limit * SIMILAR_ISSUE_CANDIDATE_MULTIPLIER, SIMILAR_ISSUE_MIN_CANDIDATES),
      100
    );
    const rows = await prisma.$queryRaw<SimilarIssueRow[]>(Prisma.sql`
      WITH nearest_candidates AS MATERIALIZED (
        SELECT
          t."id",
          t."code",
          t."title",
          t."status",
          t."severity",
          t."priorityScore",
          te."projectId",
          te."embedding" <=> ${current.embedding}::vector(768) AS distance
        FROM "public"."TicketEmbedding" te
        INNER JOIN "public"."Ticket" t
          ON t."id" = te."ticketId"
          AND t."workspaceId" = te."workspaceId"
          AND t."projectId" = te."projectId"
        WHERE te."workspaceId" = ${input.workspaceId}
          AND t."workspaceId" = ${input.workspaceId}
          AND te."ticketId" <> ${input.ticketId}
          AND te."provider" = ${TICKET_EMBEDDING_PROVIDER}
          AND te."model" = ${TICKET_EMBEDDING_MODEL}
        ORDER BY te."embedding" <=> ${current.embedding}::vector(768) ASC
        LIMIT ${candidateLimit}
      )
      SELECT
        "id",
        "code",
        "title",
        "status",
        "severity",
        "priorityScore",
        (1 - distance)::double precision AS "similarity"
      FROM nearest_candidates
      WHERE distance <= ${1 - minScore}
      ORDER BY
        CASE WHEN "projectId" = ${input.projectId} THEN 0 ELSE 1 END ASC,
        distance ASC
      LIMIT ${limit}
    `);

    return {
      issues: mapSimilarIssueRows(rows, input.ticketId),
      status: "ready",
    };
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

    return { issues: [], status: "unavailable" };
  }
}

export async function findSimilarIssuesForTicket(input: {
  ticketId: string;
  workspaceId: string;
  projectId: string;
  limit?: number;
  minScore?: number;
}): Promise<SimilarIssue[]> {
  return (await searchSimilarIssuesForTicket(input)).issues;
}
