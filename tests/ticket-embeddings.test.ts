import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedMock, googleEmbeddingMock } = vi.hoisted(() => ({
  embedMock: vi.fn(),
  googleEmbeddingMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("ai", () => ({
  embed: embedMock,
}));

vi.mock("@ai-sdk/google", () => ({
  google: {
    embedding: googleEmbeddingMock,
  },
}));

import {
  buildTicketEmbeddingInput,
  generateTicketEmbedding,
  TICKET_EMBEDDING_DIMENSIONS,
  TICKET_EMBEDDING_MODEL,
} from "@/lib/ai/ticket-embeddings";

describe("ticket embeddings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    googleEmbeddingMock.mockReturnValue("mock-embedding-model");
    embedMock.mockResolvedValue({
      embedding: Array.from({ length: TICKET_EMBEDDING_DIMENSIONS }, () => 0.01),
    });
  });

  it("builds compact embedding text from useful ticket fields and redacts secrets", () => {
    const input = buildTicketEmbeddingInput({
      title: "Login spinner never stops on Safari",
      description: "User cannot finish login. Authorization: Bearer abc123456789secret",
      expectedBehavior: "Login completes and redirects to dashboard.",
      actualBehavior: "Spinner remains visible forever.",
      stepsToReproduce: "1. Open login\n2. Submit valid credentials",
      browser: "Safari iOS",
      device: "iPhone",
      environment: "Production",
      affectedPage: "/login",
      aiSummary: "Authentication callback hangs after session refresh.",
    });

    expect(input).toContain("Title: Login spinner never stops on Safari");
    expect(input).toContain("Expected behavior: Login completes");
    expect(input).toContain("AI summary: Authentication callback hangs");
    expect(input).toContain("Bearer [REDACTED]");
    expect(input).not.toContain("abc123456789secret");
  });

  it("calls Gemini embeddings with a fixed output dimension", async () => {
    const result = await generateTicketEmbedding({
      title: "Auth form hangs on mobile",
      description: "The login form does not complete on mobile Safari.",
    });

    expect(result.embedding).toHaveLength(TICKET_EMBEDDING_DIMENSIONS);
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(googleEmbeddingMock).toHaveBeenCalledWith(TICKET_EMBEDDING_MODEL);
    expect(embedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-embedding-model",
        value: expect.stringContaining("Auth form hangs on mobile"),
        maxRetries: 1,
        providerOptions: {
          google: {
            outputDimensionality: TICKET_EMBEDDING_DIMENSIONS,
            taskType: "SEMANTIC_SIMILARITY",
          },
        },
      })
    );
  });
});
