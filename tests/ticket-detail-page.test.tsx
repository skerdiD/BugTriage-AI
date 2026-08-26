import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthorizationErrorMock,
  TicketDetailClientMock,
  createSupabaseAdminClientMock,
  createSignedTicketFileUrlMock,
  searchSimilarIssuesForTicketMock,
  getCurrentWorkspaceContextOrRedirectMock,
  getTicketByCodeMock,
  mapTicketDetailToUiTicketMock,
  notFoundMock,
} = vi.hoisted(() => {
  class AuthorizationErrorMock extends Error {}

  return {
    AuthorizationErrorMock,
    TicketDetailClientMock: vi.fn(() => null),
    createSupabaseAdminClientMock: vi.fn(),
    createSignedTicketFileUrlMock: vi.fn(),
    searchSimilarIssuesForTicketMock: vi.fn(),
    getCurrentWorkspaceContextOrRedirectMock: vi.fn(),
    getTicketByCodeMock: vi.fn(),
    mapTicketDetailToUiTicketMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("notFound");
    }),
  };
});

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/dashboard/ticket-detail-client", () => ({
  TicketDetailClient: TicketDetailClientMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentWorkspaceContextOrRedirect: getCurrentWorkspaceContextOrRedirectMock,
}));

vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: AuthorizationErrorMock,
  hasTicketPermission: () => true,
  TicketPermission: {
    MANAGE: "MANAGE",
    EXPORT: "EXPORT",
  },
}));

vi.mock("@/lib/data/ticket-mappers", () => ({
  mapTicketDetailToUiTicket: mapTicketDetailToUiTicketMock,
}));

vi.mock("@/lib/data/similar-issues", () => ({
  searchSimilarIssuesForTicket: searchSimilarIssuesForTicketMock,
}));

vi.mock("@/lib/data/tickets", () => ({
  getTicketByCode: getTicketByCodeMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

vi.mock("@/lib/supabase/storage", () => ({
  createSignedTicketFileUrl: createSignedTicketFileUrlMock,
}));

import TicketDetailPage from "@/app/(dashboard)/tickets/[ticketId]/page";

describe("ticket detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentWorkspaceContextOrRedirectMock.mockResolvedValue({
      role: "OWNER",
      workspace: {
        id: "workspace-1",
      },
    });
    createSupabaseAdminClientMock.mockReturnValue({
      storage: {},
    });
    searchSimilarIssuesForTicketMock.mockResolvedValue({
      issues: [],
      status: "not_indexed",
    });
    mapTicketDetailToUiTicketMock.mockReturnValue({
      id: "BUG-4242",
      title: "Mapped ticket",
    });
  });

  it("generates signed attachment URLs only after a workspace-safe ticket lookup", async () => {
    const dbTicket = {
      code: "BUG-4242",
      id: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
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
    expect(searchSimilarIssuesForTicketMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });
    expect(mapTicketDetailToUiTicketMock).toHaveBeenCalledWith(
      dbTicket,
      {
        "attachment-1": "https://download.example/checkout.png",
      },
      [],
      "not_indexed"
    );
    expect(result.props.ticket).toEqual({
      id: "BUG-4242",
      title: "Mapped ticket",
    });
    expect(result.props.canExportGitHub).toBe(true);
    expect(result.props.canManageTicket).toBe(true);
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
    expect(searchSimilarIssuesForTicketMock).not.toHaveBeenCalled();
  });

  it("renders a 404 when the ticket lookup denies access", async () => {
    getTicketByCodeMock.mockRejectedValue(
      new AuthorizationErrorMock("Ticket not found or access denied.")
    );

    await expect(
      TicketDetailPage({
        params: Promise.resolve({
          ticketId: "BUG-4040",
        }),
      })
    ).rejects.toThrow("notFound");

    expect(notFoundMock).toHaveBeenCalled();
    expect(createSignedTicketFileUrlMock).not.toHaveBeenCalled();
    expect(searchSimilarIssuesForTicketMock).not.toHaveBeenCalled();
  });

  it("does not require the Supabase admin client when a ticket has no attachments", async () => {
    const dbTicket = {
      code: "BUG-4242",
      id: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      attachments: [],
    };

    getTicketByCodeMock.mockResolvedValue(dbTicket);

    await TicketDetailPage({
      params: Promise.resolve({
        ticketId: "BUG-4242",
      }),
    });

    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
    expect(createSignedTicketFileUrlMock).not.toHaveBeenCalled();
    expect(mapTicketDetailToUiTicketMock).toHaveBeenCalledWith(
      dbTicket,
      {},
      [],
      "not_indexed"
    );
  });

  it("keeps rendering when attachment signing is not configured", async () => {
    const dbTicket = {
      code: "BUG-4242",
      id: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      attachments: [
        {
          id: "attachment-1",
          storagePath:
            "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
        },
      ],
    };

    getTicketByCodeMock.mockResolvedValue(dbTicket);
    createSupabaseAdminClientMock.mockImplementation(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
    });

    await TicketDetailPage({
      params: Promise.resolve({
        ticketId: "BUG-4242",
      }),
    });

    expect(createSignedTicketFileUrlMock).not.toHaveBeenCalled();
    expect(mapTicketDetailToUiTicketMock).toHaveBeenCalledWith(
      dbTicket,
      {
        "attachment-1": null,
      },
      [],
      "not_indexed"
    );
  });
});
