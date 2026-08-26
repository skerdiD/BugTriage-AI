import "server-only";

import { createHash } from "crypto";

import { google } from "@ai-sdk/google";
import { embed } from "ai";

import { redactSensitiveText } from "@/lib/security/redaction";

export const TICKET_EMBEDDING_PROVIDER = "google-gemini";
export const TICKET_EMBEDDING_MODEL = "gemini-embedding-001";
export const TICKET_EMBEDDING_DIMENSIONS = 768;
export const TICKET_EMBEDDING_MAX_INPUT_CHARS = 6_000;

export type TicketEmbeddingSource = {
  title?: string | null;
  description?: string | null;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  stepsToReproduce?: string | null;
  browser?: string | null;
  device?: string | null;
  environment?: string | null;
  affectedPage?: string | null;
  aiSummary?: string | null;
};

export type GeneratedTicketEmbedding = {
  embedding: number[];
  content: string;
  contentHash: string;
  provider: typeof TICKET_EMBEDDING_PROVIDER;
  model: typeof TICKET_EMBEDDING_MODEL;
};

function normalizeEmbedding(embedding: number[]) {
  if (!embedding.every(Number.isFinite)) {
    throw new Error("Ticket embedding contains non-finite values.");
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, value) => sum + value * value, 0)
  );

  if (!Number.isFinite(magnitude) || magnitude === 0) {
    throw new Error("Ticket embedding has zero magnitude.");
  }

  return embedding.map((value) => value / magnitude);
}

function compact(value?: string | null) {
  return redactSensitiveText(value?.trim().replace(/\s+/g, " ") ?? "");
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  return `${value.slice(0, Math.max(0, maxLength - 14)).trimEnd()}\n[TRUNCATED]`;
}

export function buildTicketEmbeddingInput(source: TicketEmbeddingSource) {
  const sections = [
    ["Title", source.title],
    ["Description", source.description],
    ["Expected behavior", source.expectedBehavior],
    ["Actual behavior", source.actualBehavior],
    ["Reproduction steps", source.stepsToReproduce],
    ["Browser", source.browser],
    ["Device", source.device],
    ["Environment", source.environment],
    ["Affected page", source.affectedPage],
    ["AI summary", source.aiSummary],
  ]
    .map(([label, value]) => {
      const cleaned = compact(value);
      return cleaned ? `${label}: ${cleaned}` : null;
    })
    .filter((value): value is string => Boolean(value));

  return truncate(sections.join("\n"), TICKET_EMBEDDING_MAX_INPUT_CHARS);
}

export function hashTicketEmbeddingContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export async function generateTicketEmbedding(
  source: TicketEmbeddingSource
): Promise<GeneratedTicketEmbedding> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY.");
  }

  const content = buildTicketEmbeddingInput(source);

  if (!content) {
    throw new Error("Ticket embedding input is empty.");
  }

  const result = await embed({
    model: google.embedding(TICKET_EMBEDDING_MODEL),
    value: content,
    maxRetries: 1,
    providerOptions: {
      google: {
        outputDimensionality: TICKET_EMBEDDING_DIMENSIONS,
        taskType: "SEMANTIC_SIMILARITY",
      },
    },
  });

  if (result.embedding.length !== TICKET_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${TICKET_EMBEDDING_DIMENSIONS} embedding dimensions, received ${result.embedding.length}.`
    );
  }

  // gemini-embedding-001 does not normalize reduced-dimension vectors. Cosine
  // search is more numerically stable when every stored vector has unit length.
  const normalizedEmbedding = normalizeEmbedding(result.embedding);

  return {
    embedding: normalizedEmbedding,
    content,
    contentHash: hashTicketEmbeddingContent(content),
    provider: TICKET_EMBEDDING_PROVIDER,
    model: TICKET_EMBEDDING_MODEL,
  };
}
