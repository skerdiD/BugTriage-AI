import { WorkspaceRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
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
    prismaMock.workspaceMember.upsert.mockResolvedValue({
      id: "membership-1",
      role: WorkspaceRole.OWNER,
    });
    prismaMock.project.findFirst.mockResolvedValue({
      id: "project-1",
      workspaceId: "workspace-1",
    });
  });

  it("moves an email-matched local user to a recreated auth user id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.upsert.mockResolvedValue({
      id: "auth-user-new",
      email: "owner@example.com",
      name: "Owner Name",
    });

    const result = await ensureUserWorkspace({
      authUserId: "auth-user-new",
      email: "owner@example.com",
      name: "Owner Name",
    });

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { email: "owner@example.com" },
      create: {
        id: "auth-user-new",
        email: "owner@example.com",
        name: "Owner Name",
      },
      update: {
        id: "auth-user-new",
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

  it("atomically provisions a new user and their default resources", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.upsert.mockResolvedValue({
      id: "auth-user-new",
      email: "owner@example.com",
      name: "Owner Name",
    });
    prismaMock.workspace.findFirst.mockResolvedValue(null);
    prismaMock.workspace.upsert.mockResolvedValue({
      id: "workspace-1",
      ownerId: "auth-user-new",
    });
    prismaMock.workspace.findUnique.mockResolvedValue({
      id: "workspace-1",
      ownerId: "auth-user-new",
      _count: { projects: 0 },
    });
    prismaMock.project.findFirst.mockResolvedValue(null);
    prismaMock.project.upsert.mockResolvedValue({
      id: "project-1",
      workspaceId: "workspace-1",
    });

    const result = await ensureUserWorkspace({
      authUserId: "auth-user-new",
      email: "owner@example.com",
      name: "Owner Name",
    });

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { email: "owner@example.com" },
      create: {
        id: "auth-user-new",
        email: "owner@example.com",
        name: "Owner Name",
      },
      update: {
        id: "auth-user-new",
        name: "Owner Name",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    expect(prismaMock.workspace.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "personal-auth-user-new" },
        update: { name: "Owner Name Workspace" },
      })
    );
    expect(prismaMock.workspaceMember.upsert).toHaveBeenCalledOnce();
    expect(prismaMock.project.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId_slug: {
            workspaceId: "workspace-1",
            slug: "bug-intake",
          },
        },
        update: {
          name: "Bug Intake",
          description:
            "Default home for incoming reports, private evidence, AI triage, and engineering follow-up.",
        },
      })
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(result.workspace.id).toBe("workspace-1");
    expect(result.project?.id).toBe("project-1");
  });
});
