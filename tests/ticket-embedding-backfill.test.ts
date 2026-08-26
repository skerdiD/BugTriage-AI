import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAndStoreTicketEmbeddingMock, prismaMock } = vi.hoisted(() => ({
  createAndStoreTicketEmbeddingMock: vi.fn(),
  prismaMock: {
    ticket: { findMany: vi.fn() },
    $disconnect: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ai/ticket-embeddings", () => ({
  buildTicketEmbeddingInput: vi.fn(
    (source: { title?: string | null }) => `Title: ${source.title}`
  ),
  hashTicketEmbeddingContent: vi.fn((content: string) => `hash:${content}`),
  TICKET_EMBEDDING_MODEL: "gemini-embedding-001",
  TICKET_EMBEDDING_PROVIDER: "google-gemini",
}));

vi.mock("@/lib/data/similar-issues", () => ({
  createAndStoreTicketEmbedding: createAndStoreTicketEmbeddingMock,
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/security/redaction", () => ({
  getSafeErrorMessage: (error: unknown) => String(error),
}));

import { backfillTicketEmbeddings } from "@/workers/ticket-embedding-backfill";

function ticket(overrides: Record<string, unknown>) {
  return {
    id: "ticket-1",
    code: "BUG-1001",
    workspaceId: "workspace-1",
    projectId: "project-1",
    title: "Checkout fails",
    description: "Checkout remains disabled.",
    expectedBehavior: null,
    actualBehavior: null,
    stepsToReproduce: null,
    browser: null,
    device: null,
    environment: null,
    affectedPage: null,
    aiAnalysis: { summary: "Checkout cannot complete." },
    embedding: null,
    ...overrides,
  };
}

describe("ticket embedding backfill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAndStoreTicketEmbeddingMock.mockResolvedValue({
      stored: true,
      contentHash: "new-hash",
    });
  });

  it("skips current vectors and stores only missing or stale analyzed tickets", async () => {
    prismaMock.ticket.findMany.mockResolvedValue([
      ticket({
        embedding: {
          contentHash: "hash:Title: Checkout fails",
          model: "gemini-embedding-001",
          provider: "google-gemini",
        },
      }),
      ticket({
        id: "ticket-2",
        code: "BUG-1002",
        title: "Login hangs",
      }),
    ]);

    const result = await backfillTicketEmbeddings({
      ticketIds: ["ticket-1", "ticket-2"],
    });

    expect(result).toEqual({
      failed: 0,
      scanned: 2,
      skipped: 1,
      stored: 1,
    });
    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { in: ["ticket-1", "ticket-2"] },
          aiAnalysis: { isNot: null },
        },
      })
    );
    expect(createAndStoreTicketEmbeddingMock).toHaveBeenCalledOnce();
    expect(createAndStoreTicketEmbeddingMock).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: "ticket-2" })
    );
  });
});
