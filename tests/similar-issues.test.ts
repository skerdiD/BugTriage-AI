import {
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureServerExceptionMock, generateTicketEmbeddingMock, prismaMock } = vi.hoisted(() => ({
  captureServerExceptionMock: vi.fn(),
  generateTicketEmbeddingMock: vi.fn(),
  prismaMock: {
    ticket: {
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ai/ticket-embeddings", () => ({
  buildTicketEmbeddingInput: vi.fn(() => "Title: Checkout fails"),
  generateTicketEmbedding: generateTicketEmbeddingMock,
  hashTicketEmbeddingContent: vi.fn(() => "hash-1"),
  TICKET_EMBEDDING_DIMENSIONS: 768,
  TICKET_EMBEDDING_MODEL: "gemini-embedding-001",
  TICKET_EMBEDDING_PROVIDER: "google-gemini",
}));

vi.mock("@/lib/observability/server-monitoring", () => ({
  captureServerException: captureServerExceptionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  createAndStoreTicketEmbedding,
  findSimilarIssuesForTicket,
  mapSimilarIssueRows,
} from "@/lib/data/similar-issues";

describe("similar issues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps vector search rows and removes accidental self matches", () => {
    const result = mapSimilarIssueRows(
      [
        {
          id: "ticket-1",
          code: "BUG-1001",
          title: "Current ticket",
          status: TicketStatus.NEW,
          severity: TicketSeverity.MEDIUM,
          priorityScore: 50,
          similarity: 1,
        },
        {
          id: "ticket-2",
          code: "BUG-1002",
          title: "Login spinner never stops on Safari",
          status: TicketStatus.INVESTIGATING,
          severity: TicketSeverity.HIGH,
          priorityScore: 82,
          similarity: 0.889,
        },
      ],
      "ticket-1"
    );

    expect(result).toEqual([
      {
        id: "ticket-2",
        code: "BUG-1002",
        title: "Login spinner never stops on Safari",
        status: TicketStatus.INVESTIGATING,
        severity: TicketSeverity.HIGH,
        priorityScore: 82,
        similarityScore: 0.889,
      },
    ]);
  });

  it("returns an empty list when the current ticket has no embedding", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ tableName: 'public."TicketEmbedding"' }])
      .mockResolvedValueOnce([]);

    const result = await findSimilarIssuesForTicket({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });

    expect(result).toEqual([]);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("treats an embedding from an older model as not indexed", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ tableName: 'public."TicketEmbedding"' }])
      .mockResolvedValueOnce([{
        embedding: `[${"0.01,".repeat(767)}0.01]`,
        model: "older-embedding-model",
        provider: "google-gemini",
      }]);

    const result = await findSimilarIssuesForTicket({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });

    expect(result).toEqual([]);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("returns an empty list without logging when the embedding table is missing", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ tableName: null }]);

    const result = await findSimilarIssuesForTicket({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });

    expect(result).toEqual([]);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(captureServerExceptionMock).not.toHaveBeenCalled();
  });

  it("rejects embedding upserts when the ticket is outside the workspace project", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(null);

    await expect(
      createAndStoreTicketEmbedding({
        ticketId: "ticket-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        source: {
          title: "Checkout fails",
          description: "Checkout submit button remains disabled.",
        },
      })
    ).rejects.toThrow(
      "Ticket embedding target was not found in the selected workspace project."
    );

    expect(generateTicketEmbeddingMock).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it("skips embedding generation when the embedding table has not been migrated", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({ id: "ticket-1" });
    prismaMock.$queryRaw.mockResolvedValueOnce([{ tableName: null }]);

    await expect(
      createAndStoreTicketEmbedding({
        ticketId: "ticket-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        source: {
          title: "Checkout fails",
          description: "Checkout submit button remains disabled.",
        },
      })
    ).rejects.toThrow(
      "Ticket embeddings table is not available. Run the latest Prisma migration."
    );

    expect(generateTicketEmbeddingMock).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it("does not call the embedding API when content and model metadata are current", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({ id: "ticket-1" });
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ tableName: 'public."TicketEmbedding"' }])
      .mockResolvedValueOnce([
        {
          contentHash: "hash-1",
          model: "gemini-embedding-001",
          provider: "google-gemini",
        },
      ]);

    const result = await createAndStoreTicketEmbedding({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      source: {
        title: "Checkout fails",
        description: "Checkout remains disabled.",
      },
    });

    expect(result).toEqual({ stored: false, contentHash: "hash-1" });
    expect(generateTicketEmbeddingMock).not.toHaveBeenCalled();
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });

  it("regenerates unchanged content when the stored model is incompatible", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({ id: "ticket-1" });
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ tableName: 'public."TicketEmbedding"' }])
      .mockResolvedValueOnce([
        {
          contentHash: "hash-1",
          model: "older-embedding-model",
          provider: "google-gemini",
        },
      ]);
    generateTicketEmbeddingMock.mockResolvedValue({
      embedding: Array.from({ length: 768 }, () => 0.01),
      contentHash: "hash-1",
      model: "gemini-embedding-001",
      provider: "google-gemini",
    });
    prismaMock.$executeRaw.mockResolvedValue(1);

    const result = await createAndStoreTicketEmbedding({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      source: { title: "Checkout fails" },
    });

    expect(result).toEqual({ stored: true, contentHash: "hash-1" });
    expect(generateTicketEmbeddingMock).toHaveBeenCalledOnce();
    expect(prismaMock.$executeRaw).toHaveBeenCalledOnce();
  });

  it("searches only from the current ticket embedding and excludes self matches", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ tableName: 'public."TicketEmbedding"' }])
      .mockResolvedValueOnce([{
        embedding: `[${"0.01,".repeat(767)}0.01]`,
        model: "gemini-embedding-001",
        provider: "google-gemini",
      }])
      .mockResolvedValueOnce([
        {
          id: "ticket-1",
          code: "BUG-1001",
          title: "Current ticket",
          status: TicketStatus.NEW,
          severity: TicketSeverity.MEDIUM,
          priorityScore: 50,
          similarity: 1,
        },
        {
          id: "ticket-2",
          code: "BUG-1002",
          title: "Auth form hangs on mobile",
          status: TicketStatus.IN_PROGRESS,
          severity: TicketSeverity.HIGH,
          priorityScore: 86,
          similarity: 0.84,
        },
      ]);

    const result = await findSimilarIssuesForTicket({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      limit: 3,
      minScore: 0.74,
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: "ticket-2",
        code: "BUG-1002",
        similarityScore: 0.84,
      }),
    ]);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(3);

    const searchSql = (
      prismaMock.$queryRaw.mock.calls[2]?.[0] as { strings?: readonly string[] }
    ).strings?.join("?");

    // The vector candidate scan is directly workspace-filtered, and the joined
    // ticket is independently constrained to the same workspace.
    expect(searchSql).toContain('te."workspaceId" = ?');
    expect(searchSql).toContain('t."workspaceId" = ?');
    expect(searchSql).toContain('t."workspaceId" = te."workspaceId"');
    expect(searchSql).toContain("WITH nearest_candidates AS MATERIALIZED");
    expect(searchSql).toContain('te."provider" = ?');
    expect(searchSql).toContain('te."model" = ?');
    expect(searchSql).toContain(
      'ORDER BY te."embedding" <=> ?::vector(768) ASC'
    );
  });
});
