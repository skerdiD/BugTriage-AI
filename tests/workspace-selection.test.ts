import { WorkspaceRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canManageWorkspaceMemberRole,
  hasRequiredWorkspaceRole,
} from "@/lib/auth/authorization";
import {
  pickCurrentProject,
  pickCurrentWorkspace,
  type ProjectSummary,
  type WorkspaceSummary,
} from "@/lib/data/workspaces";

const workspaces: WorkspaceSummary[] = [
  {
    id: "workspace-1",
    name: "Acme Workspace",
    slug: "acme-workspace",
    ownerId: "user-1",
    ownerName: "Owner One",
    ownerEmail: "owner-one@example.com",
    role: WorkspaceRole.OWNER,
    memberCount: 4,
    projectCount: 2,
    ticketCount: 10,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "workspace-2",
    name: "Beta Workspace",
    slug: "beta-workspace",
    ownerId: "user-2",
    ownerName: "Owner Two",
    ownerEmail: "owner-two@example.com",
    role: WorkspaceRole.MEMBER,
    memberCount: 8,
    projectCount: 1,
    ticketCount: 21,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
  },
];

const projects: ProjectSummary[] = [
  {
    id: "project-1",
    workspaceId: "workspace-1",
    name: "Bug Intake",
    slug: "bug-intake",
    description: "Default project",
    ticketCount: 4,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "project-2",
    workspaceId: "workspace-1",
    name: "Checkout Experience",
    slug: "checkout-experience",
    description: "Checkout bugs",
    ticketCount: 6,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  },
];

describe("workspace selection helpers", () => {
  it("prefers the cookie-selected workspace when the user still has access", () => {
    expect(pickCurrentWorkspace(workspaces, "workspace-2")?.id).toBe("workspace-2");
  });

  it("falls back to the first accessible workspace when the cookie is stale", () => {
    expect(pickCurrentWorkspace(workspaces, "workspace-missing")?.id).toBe(
      "workspace-1"
    );
  });

  it("prefers the cookie-selected project when it belongs to the active workspace list", () => {
    expect(pickCurrentProject(projects, "project-2")?.id).toBe("project-2");
  });

  it("returns null for project selection when a workspace has no projects", () => {
    expect(pickCurrentProject([], "project-2")).toBeNull();
  });
});

describe("workspace role checks", () => {
  it("allows owners and admins to pass admin-level checks", () => {
    expect(hasRequiredWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)).toBe(
      true
    );
    expect(hasRequiredWorkspaceRole(WorkspaceRole.ADMIN, WorkspaceRole.ADMIN)).toBe(
      true
    );
  });

  it("blocks members from admin-level workspace actions", () => {
    expect(hasRequiredWorkspaceRole(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN)).toBe(
      false
    );
  });

  it("lets owners manage admins and members while admins only manage members", () => {
    expect(
      canManageWorkspaceMemberRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    ).toBe(true);
    expect(
      canManageWorkspaceMemberRole(WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    ).toBe(true);
    expect(
      canManageWorkspaceMemberRole(WorkspaceRole.ADMIN, WorkspaceRole.MEMBER)
    ).toBe(true);
    expect(
      canManageWorkspaceMemberRole(WorkspaceRole.ADMIN, WorkspaceRole.ADMIN)
    ).toBe(false);
    expect(
      canManageWorkspaceMemberRole(WorkspaceRole.MEMBER, WorkspaceRole.MEMBER)
    ).toBe(false);
  });
});
