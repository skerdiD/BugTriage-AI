import { WorkspaceRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserOrThrowMock, prismaMock } = vi.hoisted(() => ({
  getCurrentUserOrThrowMock: vi.fn(),
  prismaMock: {
    workspace: {
      findFirst: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    ticket: {
      findFirst: vi.fn(),
    },
    ticketAttachment: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUserOrThrow: getCurrentUserOrThrowMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  AuthorizationError,
  assertCanAccessProject,
  assertCanAccessTicket,
  assertCanCreateTicket,
  assertCanExportTicket,
  assertWorkspaceMember,
} from "@/lib/auth/authorization";

describe("authorization helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserOrThrowMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
  });

  it("returns workspace membership details for an authorized member", async () => {
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "ws-1",
      name: "Acme Workspace",
      slug: "acme-workspace",
      ownerId: "owner-1",
      members: [{ role: WorkspaceRole.ADMIN }],
    });

    const result = await assertWorkspaceMember("ws-1");

    expect(result).toMatchObject({
      userId: "user-1",
      workspace: {
        id: "ws-1",
        name: "Acme Workspace",
      },
      role: WorkspaceRole.ADMIN,
    });
  });

  it("rejects workspace access for non-members", async () => {
    prismaMock.workspace.findFirst.mockResolvedValue(null);

    await expect(assertWorkspaceMember("ws-2")).rejects.toBeInstanceOf(
      AuthorizationError
    );
  });

  it("keeps ticket lookups scoped to the provided workspace", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(null);

    await expect(
      assertCanAccessTicket({
        ticketCode: "BUG-1001",
        workspaceId: "ws-1",
      })
    ).rejects.toBeInstanceOf(AuthorizationError);

    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          code: "BUG-1001",
          workspaceId: "ws-1",
        }),
      })
    );
  });

  it("requires an admin role to export a workspace ticket", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({
      id: "ticket-1",
      workspaceId: "ws-1",
    });
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "ws-1",
      name: "Acme Workspace",
      slug: "acme-workspace",
      ownerId: "owner-1",
      members: [{ role: WorkspaceRole.MEMBER }],
    });

    await expect(
      assertCanExportTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects ticket creation when the project is outside the selected workspace", async () => {
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "ws-1",
      name: "Acme Workspace",
      slug: "acme-workspace",
      ownerId: "owner-1",
      members: [{ role: WorkspaceRole.MEMBER }],
    });
    prismaMock.project.findFirst.mockResolvedValue(null);

    await expect(
      assertCanCreateTicket("ws-1", "project-2")
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects project switching when the user does not belong to the project's workspace", async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: "project-3",
      workspaceId: "ws-9",
      name: "Hidden Project",
      slug: "hidden-project",
    });
    prismaMock.workspace.findFirst.mockResolvedValue(null);

    await expect(assertCanAccessProject("project-3")).rejects.toBeInstanceOf(
      AuthorizationError
    );
  });
});
