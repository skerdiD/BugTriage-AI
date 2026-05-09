import { beforeEach, describe, expect, it, vi } from "vitest";

const { startSpanMock, captureExceptionMock, addBreadcrumbMock } = vi.hoisted(() => ({
  startSpanMock: vi.fn(),
  captureExceptionMock: vi.fn(),
  addBreadcrumbMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: addBreadcrumbMock,
  captureException: captureExceptionMock,
  startSpan: startSpanMock,
}));

import {
  createSignedTicketFileUrl,
  validateTicketFileContents,
} from "@/lib/supabase/storage";

describe("storage security helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startSpanMock.mockImplementation(async (_config, callback) => callback());
  });

  it("rejects screenshot uploads whose content does not match the claimed image type", async () => {
    const fakeImage = new File(["not-a-real-png"], "evidence.png", {
      type: "image/png",
    });

    await expect(
      validateTicketFileContents(fakeImage, "SCREENSHOT")
    ).rejects.toThrow(
      "Screenshot file signature did not match an allowed image format."
    );
  });

  it("rejects log uploads that look like binary payloads", async () => {
    const binaryBytes = new Uint8Array([0, 159, 146, 150, 0, 0, 1, 2, 3, 4]);
    const binaryLog = new File([binaryBytes], "trace.log", {
      type: "application/octet-stream",
    });

    await expect(validateTicketFileContents(binaryLog, "LOG")).rejects.toThrow(
      "Log file contents appeared to be binary data."
    );
  });

  it("clamps signed URL expiry to a safe server-side maximum", async () => {
    const createSignedUrlMock = vi.fn().mockResolvedValue({
      data: {
        signedUrl: "https://download.example.com/file",
      },
      error: null,
    });
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: createSignedUrlMock,
        }),
      },
    };

    const result = await createSignedTicketFileUrl(
      supabase as never,
      "private/workspace-1/user-1/tickets/BUG-123/logs/trace.log",
      "workspace-1",
      60 * 60
    );

    expect(result).toBe("https://download.example.com/file");
    expect(createSignedUrlMock).toHaveBeenCalledWith(
      "private/workspace-1/user-1/tickets/BUG-123/logs/trace.log",
      60 * 15
    );
  });
});
