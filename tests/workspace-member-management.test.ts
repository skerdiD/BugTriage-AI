import { WorkspaceRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertCanManageWorkspaceMock,
  assertWorkspaceMemberMock,
  prismaMock,
} = vi.hoisted(() => ({
  assertCanManageWorkspaceMock: vi.fn(),
  assertWorkspaceMemberMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/authorization", () => {
  class AuthorizationError extends Error {}

  return {
    AuthorizationError,
    assertCanManageWorkspace: assertCanManageWorkspaceMock,
    assertWorkspaceMember: assertWorkspaceMemberMock,
    canManageWorkspaceMemberRole: (actorRole: WorkspaceRole, targetRole: WorkspaceRole) => {
      if (actorRole === WorkspaceRole.OWNER) {
        return targetRole === WorkspaceRole.ADMIN || targetRole === WorkspaceRole.MEMBER;
      }

      if (actorRole === WorkspaceRole.ADMIN) {
        return targetRole === WorkspaceRole.MEMBER;
      }

      return false;
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  createWorkspace,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  WorkspaceManagementError,
} from "@/lib/data/workspaces";

describe("workspace member management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertWorkspaceMemberMock.mockResolvedValue({
      userId: "user-1",
      workspace: {
        id: "workspace-1",
        ownerId: "owner-1",
      },
      role: WorkspaceRole.OWNER,
    });
    assertCanManageWorkspaceMock.mockResolvedValue({
      userId: "owner-1",
      workspace: {
        id: "workspace-1",
        ownerId: "owner-1",
      },
      role: WorkspaceRole.OWNER,
    });
  });

  it("creates a new workspace with an owner membership and default project", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ava Engineer",
      email: "ava@example.com",
    });
    prismaMock.workspace.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "workspace-2",
        name: "Growth Engineering",
        slug: "growth-engineering",
        ownerId: "user-1",
        createdAt: new Date("2026-05-09T09:00:00.000Z"),
        owner: {
          id: "user-1",
          name: "Ava Engineer",
          email: "ava@example.com",
        },
        members: [
          {
            userId: "user-1",
            role: WorkspaceRole.OWNER,
            joinedAt: new Date("2026-05-09T09:00:00.000Z"),
            user: {
              id: "user-1",
              name: "Ava Engineer",
              email: "ava@example.com",
            },
          },
        ],
        _count: {
          members: 1,
          projects: 1,
          tickets: 0,
        },
      });
    prismaMock.workspace.create.mockResolvedValue({
      id: "workspace-2",
    });
    prismaMock.workspaceMember.findUnique.mockResolvedValue(null);
    prismaMock.workspaceMember.create.mockResolvedValue({ id: "member-1" });
    prismaMock.project.findFirst.mockResolvedValue(null);
    prismaMock.project.create.mockResolvedValue({ id: "project-1" });

    const workspace = await createWorkspace({
      name: "Growth Engineering",
      actorUserId: "user-1",
    });

    expect(workspace).toMatchObject({
      id: "workspace-2",
      name: "Growth Engineering",
      role: WorkspaceRole.OWNER,
      projectCount: 1,
    });
    expect(prismaMock.workspaceMember.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        workspaceId: "workspace-2",
        role: WorkspaceRole.OWNER,
      },
    });
    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-2",
        name: "Bug Intake",
        slug: "bug-intake",
        description:
          "Primary project for incoming bug reports, AI triage, screenshots, and engineering follow-up.",
      },
    });
  });

  it("lets owners promote a member to admin", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValue({
      id: "member-2",
      role: WorkspaceRole.MEMBER,
      userId: "user-2",
      user: {
        name: "Casey QA",
      },
    });
    prismaMock.workspaceMember.update.mockResolvedValue({
      role: WorkspaceRole.ADMIN,
      user: {
        name: "Casey QA",
      },
    });

    const result = await updateWorkspaceMemberRole({
      workspaceId: "workspace-1",
      memberId: "member-2",
      nextRole: WorkspaceRole.ADMIN,
      actorUserId: "owner-1",
    });

    expect(result).toEqual({
      memberName: "Casey QA",
      role: WorkspaceRole.ADMIN,
    });
  });

  it("blocks admins from promoting teammates to admin", async () => {
    assertCanManageWorkspaceMock.mockResolvedValue({
      userId: "admin-1",
      workspace: {
        id: "workspace-1",
        ownerId: "owner-1",
      },
      role: WorkspaceRole.ADMIN,
    });
    prismaMock.workspaceMember.findFirst.mockResolvedValue({
      id: "member-2",
      role: WorkspaceRole.MEMBER,
      userId: "user-2",
      user: {
        name: "Casey QA",
      },
    });

    await expect(
      updateWorkspaceMemberRole({
        workspaceId: "workspace-1",
        memberId: "member-2",
        nextRole: WorkspaceRole.ADMIN,
        actorUserId: "admin-1",
      })
    ).rejects.toThrow(WorkspaceManagementError);
  });

  it("removes a manageable member from the workspace", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValue({
      id: "member-3",
      role: WorkspaceRole.MEMBER,
      userId: "user-3",
      user: {
        name: "Jordan PM",
      },
    });
    prismaMock.workspaceMember.delete.mockResolvedValue({ id: "member-3" });

    const result = await removeWorkspaceMember({
      workspaceId: "workspace-1",
      memberId: "member-3",
      actorUserId: "owner-1",
    });

    expect(result).toEqual({
      memberName: "Jordan PM",
    });
    expect(prismaMock.workspaceMember.delete).toHaveBeenCalledWith({
      where: {
        id: "member-3",
      },
    });
  });

  it("prevents removing the workspace owner", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValue({
      id: "owner-membership",
      role: WorkspaceRole.OWNER,
      userId: "owner-1",
      user: {
        name: "Owner One",
      },
    });

    await expect(
      removeWorkspaceMember({
        workspaceId: "workspace-1",
        memberId: "owner-membership",
        actorUserId: "owner-1",
      })
    ).rejects.toThrow(WorkspaceManagementError);
  });
});
