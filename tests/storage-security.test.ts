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
  buildTicketStoragePath,
  createSignedTicketFileUrl,
  MAX_TICKET_FILE_SIZE_BYTES,
  TicketStorageError,
  uploadTicketFile,
  validateTicketFile,
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

  it("accepts valid screenshot file metadata before upload", () => {
    const png = new File([new Uint8Array([137, 80, 78, 71])], "evidence.png", {
      type: "image/png",
    });

    expect(validateTicketFile(png, "SCREENSHOT")).toEqual({
      valid: true,
      message: null,
    });
  });

  it("accepts valid log file metadata before upload", () => {
    const log = new File(["TypeError: paymentIntent is undefined"], "trace.log", {
      type: "text/plain",
    });

    expect(validateTicketFile(log, "LOG")).toEqual({
      valid: true,
      message: null,
    });
  });

  it("rejects invalid upload file types before storage is called", () => {
    const executable = new File(["not allowed"], "payload.exe", {
      type: "application/x-msdownload",
    });

    expect(validateTicketFile(executable, "LOG")).toEqual({
      valid: false,
      message: "Log file must be TXT, LOG, or JSON.",
    });
  });

  it("rejects files larger than the per-file limit before storage is called", () => {
    const oversized = new File(
      [new Uint8Array(MAX_TICKET_FILE_SIZE_BYTES + 1)],
      "huge.log",
      { type: "text/plain" }
    );

    expect(validateTicketFile(oversized, "LOG")).toEqual({
      valid: false,
      message: "File must be 10MB or smaller.",
    });
  });

  it("builds unique private ticket storage paths for repeated filenames", () => {
    const firstPath = buildTicketStoragePath({
      userId: "user-1",
      workspaceId: "workspace-1",
      ticketCode: "BUG-123",
      attachmentType: "LOG",
      fileName: "Trace Log.log",
    });
    const secondPath = buildTicketStoragePath({
      userId: "user-1",
      workspaceId: "workspace-1",
      ticketCode: "BUG-123",
      attachmentType: "LOG",
      fileName: "Trace Log.log",
    });

    expect(firstPath).toMatch(
      /^private\/workspace-1\/user-1\/tickets\/BUG-123\/logs\/\d+-[a-f0-9-]+-trace-log\.log$/
    );
    expect(secondPath).not.toBe(firstPath);
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

  it("returns a useful setup error when Supabase Storage reports a missing bucket", async () => {
    const uploadMock = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Bucket not found",
        statusCode: "404",
        error: "not_found",
      },
    });
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: uploadMock,
        }),
      },
    };
    const pngBytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);

    await expect(
      uploadTicketFile({
        supabase: supabase as never,
        file: new File([pngBytes], "evidence.png", { type: "image/png" }),
        userId: "user-1",
        workspaceId: "workspace-1",
        ticketCode: "BUG-123",
        attachmentType: "SCREENSHOT",
      })
    ).rejects.toMatchObject({
      name: "TicketStorageError",
      userMessage:
        "Attachment storage is not configured yet. Create the private Supabase Storage bucket and try again.",
    } satisfies Partial<TicketStorageError>);
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("rejects signed URL generation when the storage path does not belong to the ticket", async () => {
    const supabase = {
      storage: {
        from: vi.fn(),
      },
    };

    await expect(
      createSignedTicketFileUrl(
        supabase as never,
        "private/workspace-1/user-1/tickets/BUG-999/logs/trace.log",
        "workspace-1",
        300,
        "BUG-123"
      )
    ).rejects.toThrow("Attachment storage path failed ticket validation.");
  });
});
