import { WorkspaceRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/authorization", () => ({
  assertCanManageWorkspace: vi.fn(),
  assertWorkspaceMember: vi.fn(),
  canManageWorkspaceMemberRole: vi.fn(),
}));

import { ensureUserWorkspace } from "@/lib/data/workspaces";

describe("workspace user identity recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "workspace-1",
      ownerId: "auth-user-new",
      _count: { projects: 1 },
    });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      id: "membership-1",
      role: WorkspaceRole.OWNER,
    });
    prismaMock.project.findFirst.mockResolvedValue({
      id: "project-1",
      workspaceId: "workspace-1",
    });
  });

  it("moves an email-matched local user to a recreated auth user id", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "auth-user-old",
        email: "owner@example.com",
        name: "Old Name",
      });
    prismaMock.user.update.mockResolvedValue({
      id: "auth-user-new",
      email: "owner@example.com",
      name: "Owner Name",
    });

    const result = await ensureUserWorkspace({
      authUserId: "auth-user-new",
      email: "owner@example.com",
      name: "Owner Name",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "auth-user-old" },
      data: {
        id: "auth-user-new",
        email: "owner@example.com",
        name: "Owner Name",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    expect(result.user.id).toBe("auth-user-new");
  });
});
