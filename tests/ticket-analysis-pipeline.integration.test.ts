import { randomUUID } from "node:crypto";

import {
  AiProcessingStatus,
  TicketActivityType,
  TicketAnalysisDispatchStatus,
  TicketSeverity,
} from "@prisma/client";
import { Worker } from "bullmq";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { analyzeBugReportMock, getCurrentUserMock, generateEmbeddingMock } =
  vi.hoisted(() => ({
    analyzeBugReportMock: vi.fn(),
    getCurrentUserMock: vi.fn(),
    generateEmbeddingMock: vi.fn(),
  }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentUserOrThrow: getCurrentUserMock,
}));
vi.mock("@/lib/ai/bug-triage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/bug-triage")>();
  return { ...actual, analyzeBugReportWithGemini: analyzeBugReportMock };
});
vi.mock("@/lib/ai/ticket-embeddings", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/ai/ticket-embeddings")>();

  generateEmbeddingMock.mockImplementation(async (source) => {
    const content = actual.buildTicketEmbeddingInput(source);
    return {
      embedding: [1, ...Array.from({ length: 767 }, () => 0)],
      content,
      contentHash: actual.hashTicketEmbeddingContent(content),
      provider: actual.TICKET_EMBEDDING_PROVIDER,
      model: actual.TICKET_EMBEDDING_MODEL,
    };
  });

  return { ...actual, generateTicketEmbedding: generateEmbeddingMock };
});

import { createTicket } from "@/lib/data/tickets";
import {
  BUG_ANALYSIS_QUEUE_NAME,
  closeBugAnalysisQueue,
  enqueueBugAnalysis,
  getBugAnalysisQueue,
  type BugAnalysisJobData,
} from "@/lib/queue/bug-analysis";
import { createBugAnalysisProcessor } from "@/lib/queue/bug-analysis-worker";
import { dispatchTicketAnalysis } from "@/lib/queue/dispatch-ticket-analysis";
import { createRedisConnection } from "@/lib/queue/redis";
import { prisma } from "@/lib/prisma";

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;

if (!databaseUrl?.includes("_test")) {
  throw new Error(
    "Queue integration tests require DATABASE_URL to point to a dedicated test database."
  );
}

if (!redisUrl) {
  throw new Error("Queue integration tests require REDIS_URL.");
}

const parsedRedisUrl = new URL(redisUrl);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(parsedRedisUrl.hostname) ||
  parsedRedisUrl.pathname !== "/15"
) {
  throw new Error(
    "Queue integration tests require an isolated local Redis database at index 15."
  );
}

const suffix = randomUUID().replaceAll("-", "");
const ownerId = `pipeline-owner-${suffix}`;
const workspaceId = `pipeline-workspace-${suffix}`;
const projectId = `pipeline-project-${suffix}`;

const aiOutput = {
  improvedTitle: "Checkout submission fails on Safari mobile",
  summary:
    "Safari mobile users cannot submit checkout after entering valid payment details.",
  severity: "HIGH" as const,
  category: "Payments",
  reproductionSteps: [
    "Open checkout in Safari on iOS.",
    "Enter valid payment details and submit the form.",
  ],
  likelyCause: "Safari input events leave the payment validation state stale.",
  suggestedFix:
    "Normalize the payment input events and add a Safari regression test.",
  priorityScore: 88,
  confidenceScore: 93,
  tags: ["checkout", "safari", "payments"],
  developerTask:
    "Fix Safari payment validation state and add browser-level regression coverage.",
};

async function waitFor<T>(input: {
  description: string;
  load: () => Promise<T>;
  accept: (value: T) => boolean;
  timeoutMs?: number;
}) {
  const deadline = Date.now() + (input.timeoutMs ?? 10_000);
  let lastValue = await input.load();

  while (!input.accept(lastValue)) {
    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out waiting for ${input.description}. Last value: ${JSON.stringify(lastValue)}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
    lastValue = await input.load();
  }

  return lastValue;
}

describe("ticket analysis PostgreSQL -> BullMQ -> worker pipeline", () => {
  let worker: Worker<BugAnalysisJobData> | undefined;
  let workerConnection: ReturnType<typeof createRedisConnection> | undefined;

  beforeAll(async () => {
    getCurrentUserMock.mockResolvedValue({ id: ownerId });
    analyzeBugReportMock.mockResolvedValue(aiOutput);

    await getBugAnalysisQueue().obliterate({ force: true });
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `pipeline-${suffix}@example.test`,
        name: "Pipeline integration owner",
        ownedWorkspaces: {
          create: {
            id: workspaceId,
            name: "Pipeline integration workspace",
            slug: `pipeline-workspace-${suffix}`,
            projects: {
              create: {
                id: projectId,
                name: "Pipeline integration project",
                slug: `pipeline-project-${suffix}`,
              },
            },
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (worker) await worker.close();
    if (workerConnection && workerConnection.status !== "end") {
      await workerConnection.quit();
    }

    const queue = getBugAnalysisQueue();
    await queue.obliterate({ force: true });
    await closeBugAnalysisQueue();
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it("persists one analysis when a durable dispatch is delivered more than once", async () => {
    const ticket = await createTicket({
      workspaceId,
      projectId,
      reporterId: ownerId,
      code: `PIPELINE-${suffix}`,
      title: "Payment form fails on Safari mobile",
      description:
        "The checkout submit button remains disabled after valid payment details are entered.",
      expectedBehavior: "The payment form should submit.",
      actualBehavior: "The submit button remains disabled.",
      stepsToReproduce: "Open checkout, enter payment details, and submit.",
      browser: "Safari",
      device: "iPhone",
      environment: "production",
      affectedPage: "/checkout",
      aiInputContext: { consoleLogs: "Payment state did not refresh." },
    });

    const created = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: { analysisDispatches: true, activities: true },
    });
    expect(created.aiProcessingStatus).toBe(AiProcessingStatus.PENDING);
    expect(created.analysisDispatches).toHaveLength(1);
    expect(created.analysisDispatches[0]).toMatchObject({
      ticketId: ticket.id,
      jobId: created.aiProcessingJobId,
      status: TicketAnalysisDispatchStatus.PENDING,
      attempts: 0,
    });
    expect(created.activities).toEqual([
      expect.objectContaining({ type: TicketActivityType.CREATED }),
    ]);

    const dispatch = await dispatchTicketAnalysis({
      ticketId: ticket.id,
      requestedById: ownerId,
    });
    expect(dispatch).toMatchObject({
      mode: "queued",
      jobId: created.aiProcessingJobId,
      queueName: BUG_ANALYSIS_QUEUE_NAME,
    });

    const queue = getBugAnalysisQueue();
    const queuedJob = await queue.getJob(created.aiProcessingJobId!);
    expect(queuedJob).not.toBeNull();
    expect(queuedJob?.data).toEqual({ ticketId: ticket.id });
    expect(await queuedJob?.getState()).toBe("waiting");

    const repeatedDispatch = await dispatchTicketAnalysis({
      ticketId: ticket.id,
      requestedById: ownerId,
    });
    expect(repeatedDispatch).toEqual({
      mode: "pending",
      jobId: created.aiProcessingJobId,
    });
    expect(await queue.getJobCounts("waiting", "active", "delayed")).toMatchObject({
      waiting: 1,
      active: 0,
      delayed: 0,
    });

    workerConnection = createRedisConnection("worker");
    worker = new Worker<BugAnalysisJobData>(
      BUG_ANALYSIS_QUEUE_NAME,
      createBugAnalysisProcessor(),
      { connection: workerConnection, concurrency: 1 }
    );
    await worker.waitUntilReady();

    const completed = await waitFor({
      description: "the ticket analysis to complete",
      load: () =>
        prisma.ticket.findUniqueOrThrow({
          where: { id: ticket.id },
          select: { aiProcessingStatus: true },
        }),
      accept: (value) =>
        value.aiProcessingStatus === AiProcessingStatus.COMPLETED,
    });
    expect(completed.aiProcessingStatus).toBe(AiProcessingStatus.COMPLETED);

    const persisted = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: {
        aiAnalysis: true,
        aiAnalysisRuns: true,
        analysisDispatches: true,
        activities: true,
      },
    });
    const embeddings = await prisma.$queryRaw<
      Array<{ ticketId: string; dimensions: number }>
    >`
      SELECT "ticketId", vector_dims("embedding") AS dimensions
      FROM "TicketEmbedding"
      WHERE "ticketId" = ${ticket.id}
    `;

    expect(persisted).toMatchObject({
      title: aiOutput.improvedTitle,
      severity: TicketSeverity.HIGH,
      category: aiOutput.category,
      priorityScore: aiOutput.priorityScore,
      aiConfidence: aiOutput.confidenceScore,
      aiProcessingStatus: AiProcessingStatus.COMPLETED,
      aiProcessingError: null,
      aiInputContext: null,
      aiAnalysis: expect.objectContaining({ summary: aiOutput.summary }),
    });
    expect(persisted.aiAnalysisRuns).toEqual([
      expect.objectContaining({
        processingJobId: created.aiProcessingJobId,
        summary: aiOutput.summary,
      }),
    ]);
    expect(persisted.analysisDispatches).toEqual([
      expect.objectContaining({
        status: TicketAnalysisDispatchStatus.DISPATCHED,
        attempts: 1,
      }),
    ]);
    expect(
      persisted.activities.filter(
        (activity) => activity.type === TicketActivityType.AI_ANALYZED
      )
    ).toHaveLength(1);
    expect(embeddings).toEqual([{ ticketId: ticket.id, dimensions: 768 }]);
    expect(analyzeBugReportMock).toHaveBeenCalledOnce();
    expect(generateEmbeddingMock).toHaveBeenCalledOnce();

    const completedJob = await waitFor({
      description: "the BullMQ job to reach completed state",
      load: async () => {
        const job = await queue.getJob(created.aiProcessingJobId!);
        return { job, state: job ? await job.getState() : "missing" };
      },
      accept: (value) => value.state === "completed",
    });
    await completedJob.job?.remove();

    await enqueueBugAnalysis({
      ticketId: ticket.id,
      jobId: created.aiProcessingJobId!,
    });
    await waitFor({
      description: "the duplicate delivery to finish",
      load: async () => {
        const job = await queue.getJob(created.aiProcessingJobId!);
        return job ? job.getState() : Promise.resolve("missing");
      },
      accept: (state) => state === "completed",
    });

    expect(analyzeBugReportMock).toHaveBeenCalledOnce();
    expect(generateEmbeddingMock).toHaveBeenCalledOnce();
    expect(
      await prisma.ticketAiAnalysisRun.count({ where: { ticketId: ticket.id } })
    ).toBe(1);
    expect(
      await prisma.ticketActivity.count({
        where: { ticketId: ticket.id, type: TicketActivityType.AI_ANALYZED },
      })
    ).toBe(1);
  });
});
