import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  captureMock,
  connection,
  createRedisConnectionMock,
  queueCloseMock,
  queueAddMock,
  queueOnMock,
} = vi.hoisted(() => ({
  captureMock: vi.fn(),
  connection: {
    status: "ready",
    quit: vi.fn().mockResolvedValue("OK"),
    ping: vi.fn(),
    disconnect: vi.fn(),
  },
  createRedisConnectionMock: vi.fn(),
  queueCloseMock: vi.fn().mockResolvedValue(undefined),
  queueAddMock: vi.fn().mockResolvedValue({ id: "analysis-job-1" }),
  queueOnMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/server-monitoring", () => ({
  captureServerException: captureMock,
}));
vi.mock("@/lib/queue/redis", () => ({
  createRedisConnection: createRedisConnectionMock,
}));
vi.mock("bullmq", () => ({
  Queue: class QueueMock {
    close = queueCloseMock;
    add = queueAddMock;
    on = queueOnMock;
  },
}));

import {
  closeBugAnalysisQueue,
  enqueueBugAnalysis,
  getBugAnalysisQueue,
} from "@/lib/queue/bug-analysis";

describe("bug analysis producer lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes both BullMQ and its externally owned ioredis connection", async () => {
    createRedisConnectionMock.mockReturnValue(connection);

    getBugAnalysisQueue();

    const errorHandler = queueOnMock.mock.calls.find(
      ([event]) => event === "error"
    )?.[1] as ((error: Error) => void) | undefined;
    errorHandler?.(new Error("connection interrupted"));

    await closeBugAnalysisQueue();

    expect(createRedisConnectionMock).toHaveBeenCalledWith("producer");
    expect(queueOnMock).toHaveBeenCalledWith("error", expect.any(Function));
    expect(captureMock).toHaveBeenCalledOnce();
    expect(queueCloseMock).toHaveBeenCalledOnce();
    expect(connection.quit).toHaveBeenCalledOnce();
    expect(connection.disconnect).not.toHaveBeenCalled();

    await closeBugAnalysisQueue();
    expect(queueCloseMock).toHaveBeenCalledOnce();
    expect(connection.quit).toHaveBeenCalledOnce();
  });

  it("force-disconnects ioredis if graceful producer cleanup fails", async () => {
    createRedisConnectionMock.mockReturnValue(connection);
    queueCloseMock.mockRejectedValueOnce(new Error("queue close failed"));
    connection.quit.mockRejectedValueOnce(new Error("Redis quit failed"));

    getBugAnalysisQueue();

    await expect(closeBugAnalysisQueue()).rejects.toBeInstanceOf(AggregateError);
    expect(connection.disconnect).toHaveBeenCalledOnce();
  });

  it("fails publication promptly and disconnects before closing an offline queue", async () => {
    connection.status = "reconnecting";
    connection.ping.mockRejectedValueOnce(new Error("connection unavailable"));
    createRedisConnectionMock.mockReturnValue(connection);
    connection.disconnect.mockImplementationOnce(() => { connection.status = "end"; });

    await expect(enqueueBugAnalysis({ ticketId: "ticket-1", jobId: "analysis-job-1" })).rejects.toThrow("Redis is not ready");
    await closeBugAnalysisQueue();

    expect(connection.disconnect).toHaveBeenCalledOnce();
    expect(connection.quit).not.toHaveBeenCalled();
    connection.status = "ready";
  });

  it("allows a healthy cold connection to publish in a one-shot process", async () => {
    connection.status = "connecting";
    connection.ping.mockImplementationOnce(async () => { connection.status = "ready"; return "PONG"; });
    createRedisConnectionMock.mockReturnValue(connection);

    await expect(enqueueBugAnalysis({ ticketId: "ticket-1", jobId: "analysis-job-1" })).resolves.toMatchObject({ jobId: "analysis-job-1" });
    expect(connection.ping).toHaveBeenCalledOnce();
    expect(queueAddMock).toHaveBeenCalledOnce();
    await closeBugAnalysisQueue();
  });
});
