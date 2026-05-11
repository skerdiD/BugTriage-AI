import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  TicketDetailClientMock,
  createServerSupabaseClientMock,
  createSignedTicketFileUrlMock,
  getCurrentWorkspaceContextOrRedirectMock,
  getTicketByCodeMock,
  mapTicketDetailToUiTicketMock,
  notFoundMock,
} = vi.hoisted(() => ({
  TicketDetailClientMock: vi.fn(() => null),
  createServerSupabaseClientMock: vi.fn(),
  createSignedTicketFileUrlMock: vi.fn(),
  getCurrentWorkspaceContextOrRedirectMock: vi.fn(),
  getTicketByCodeMock: vi.fn(),
  mapTicketDetailToUiTicketMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/dashboard/ticket-detail-client", () => ({
  TicketDetailClient: TicketDetailClientMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentWorkspaceContextOrRedirect: getCurrentWorkspaceContextOrRedirectMock,
}));

vi.mock("@/lib/data/ticket-mappers", () => ({
  mapTicketDetailToUiTicket: mapTicketDetailToUiTicketMock,
}));

vi.mock("@/lib/data/tickets", () => ({
  getTicketByCode: getTicketByCodeMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/supabase/storage", () => ({
  createSignedTicketFileUrl: createSignedTicketFileUrlMock,
}));

import TicketDetailPage from "@/app/(dashboard)/tickets/[ticketId]/page";

describe("ticket detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentWorkspaceContextOrRedirectMock.mockResolvedValue({
      workspace: {
        id: "workspace-1",
      },
    });
    createServerSupabaseClientMock.mockResolvedValue({
      storage: {},
    });
    mapTicketDetailToUiTicketMock.mockReturnValue({
      id: "BUG-4242",
      title: "Mapped ticket",
    });
  });

  it("generates signed attachment URLs only after a workspace-safe ticket lookup", async () => {
    const dbTicket = {
      code: "BUG-4242",
      workspaceId: "workspace-1",
      attachments: [
        {
          id: "attachment-1",
          storagePath:
            "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
        },
      ],
    };

    getTicketByCodeMock.mockResolvedValue(dbTicket);
    createSignedTicketFileUrlMock.mockResolvedValue(
      "https://download.example/checkout.png"
    );

    const result = await TicketDetailPage({
      params: Promise.resolve({
        ticketId: "BUG-4242",
      }),
    });

    expect(getTicketByCodeMock).toHaveBeenCalledWith("BUG-4242", "workspace-1");
    expect(createSignedTicketFileUrlMock).toHaveBeenCalledWith(
      {
        storage: {},
      },
      "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
      "workspace-1",
      undefined,
      "BUG-4242"
    );
    expect(createSignedTicketFileUrlMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      getTicketByCodeMock.mock.invocationCallOrder[0]
    );
    expect(mapTicketDetailToUiTicketMock).toHaveBeenCalledWith(dbTicket, {
      "attachment-1": "https://download.example/checkout.png",
    });
    expect(result.props.ticket).toEqual({
      id: "BUG-4242",
      title: "Mapped ticket",
    });
  });

  it("stops before signed URL generation when the ticket is missing", async () => {
    getTicketByCodeMock.mockResolvedValue(null);

    await expect(
      TicketDetailPage({
        params: Promise.resolve({
          ticketId: "BUG-4040",
        }),
      })
    ).rejects.toThrow("notFound");

    expect(notFoundMock).toHaveBeenCalled();
    expect(createSignedTicketFileUrlMock).not.toHaveBeenCalled();
  });
});
