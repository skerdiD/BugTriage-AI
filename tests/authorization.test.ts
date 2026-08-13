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
  assertCanCommentOnTicket,
  assertCanCreateTicket,
  assertCanExportTicket,
  assertCanManageTicket,
  assertCanModifyTicket,
  assertWorkspaceMember,
  hasTicketPermission,
  TicketPermission,
} from "@/lib/auth/authorization";

function mockTicketWorkspaceRole(role: WorkspaceRole) {
  prismaMock.ticket.findFirst.mockResolvedValue({
    id: "ticket-1",
    code: "BUG-1001",
    workspaceId: "ws-1",
    projectId: "project-1",
  });
  prismaMock.workspace.findFirst.mockResolvedValue({
    id: "ws-1",
    name: "Acme Workspace",
    slug: "acme-workspace",
    ownerId: role === WorkspaceRole.OWNER ? "user-1" : "owner-1",
    members:
      role === WorkspaceRole.OWNER
        ? []
        : [{ role }],
  });
}

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

  it.each([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])(
    "allows %s to read, modify, manage, collaborate on, and export tickets",
    async (role) => {
      mockTicketWorkspaceRole(role);

      await expect(
        assertCanAccessTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
      ).resolves.toMatchObject({ workspaceAccess: { role } });
      await expect(
        assertCanModifyTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
      ).resolves.toMatchObject({ workspaceAccess: { role } });
      await expect(
        assertCanManageTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
      ).resolves.toMatchObject({ workspaceAccess: { role } });
      await expect(
        assertCanCommentOnTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
      ).resolves.toMatchObject({ workspaceAccess: { role } });
      await expect(
        assertCanExportTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
      ).resolves.toMatchObject({ workspaceAccess: { role } });
    }
  );

  it("deliberately allows members to triage and collaborate but denies privileged operations", async () => {
    mockTicketWorkspaceRole(WorkspaceRole.MEMBER);

    await expect(
      assertCanAccessTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
    ).resolves.toBeDefined();
    await expect(
      assertCanModifyTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
    ).resolves.toBeDefined();
    await expect(
      assertCanCommentOnTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
    ).resolves.toBeDefined();
    await expect(
      assertCanManageTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
    ).rejects.toThrow("Only workspace owners and admins can manage tickets.");
    await expect(
      assertCanExportTicket({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
    ).rejects.toThrow(
      "Only workspace owners and admins can export tickets to GitHub."
    );
  });

  it("keeps the role policy explicit even where read and modify currently overlap", () => {
    expect(
      hasTicketPermission(WorkspaceRole.MEMBER, TicketPermission.READ)
    ).toBe(true);
    expect(
      hasTicketPermission(WorkspaceRole.MEMBER, TicketPermission.MODIFY)
    ).toBe(true);
    expect(
      hasTicketPermission(WorkspaceRole.MEMBER, TicketPermission.MANAGE)
    ).toBe(false);
    expect(
      hasTicketPermission(WorkspaceRole.ADMIN, TicketPermission.MANAGE)
    ).toBe(true);
  });

  it.each([
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
  ])("allows %s to create tickets in a project in their workspace", async (role) => {
    mockTicketWorkspaceRole(role);
    prismaMock.project.findFirst.mockResolvedValue({
      id: "project-1",
      workspaceId: "ws-1",
      name: "Web App",
      slug: "web-app",
    });

    await expect(
      assertCanCreateTicket("ws-1", "project-1")
    ).resolves.toMatchObject({
      project: { id: "project-1", workspaceId: "ws-1" },
      workspaceAccess: { role },
    });
  });

  it("denies every ticket permission when the user is not a workspace member", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({
      id: "ticket-1",
      code: "BUG-1001",
      workspaceId: "ws-1",
      projectId: "project-1",
    });
    prismaMock.workspace.findFirst.mockResolvedValue(null);

    for (const authorize of [
      assertCanAccessTicket,
      assertCanModifyTicket,
      assertCanManageTicket,
      assertCanCommentOnTicket,
      assertCanExportTicket,
    ]) {
      await expect(
        authorize({ ticketCode: "BUG-1001", workspaceId: "ws-1" })
      ).rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("denies a member of a different workspace without revealing the ticket", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(null);

    await expect(
      assertCanModifyTicket({ ticketCode: "BUG-2002", workspaceId: "ws-1" })
    ).rejects.toThrow("Ticket not found or access denied.");

    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          code: "BUG-2002",
          workspaceId: "ws-1",
        },
      })
    );
    expect(prismaMock.workspace.findFirst).not.toHaveBeenCalled();
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
