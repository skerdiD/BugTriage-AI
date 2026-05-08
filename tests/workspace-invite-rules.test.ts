import { WorkspaceRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canInviteWorkspaceRole,
  getInvitableWorkspaceRoles,
} from "@/lib/auth/authorization";
import { createWorkspaceInviteToken } from "@/lib/data/workspace-invites";

describe("workspace invite role rules", () => {
  it("lets owners invite admins and members", () => {
    expect(getInvitableWorkspaceRoles(WorkspaceRole.OWNER)).toEqual([
      WorkspaceRole.ADMIN,
      WorkspaceRole.MEMBER,
    ]);
    expect(
      canInviteWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    ).toBe(true);
    expect(
      canInviteWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    ).toBe(true);
  });

  it("lets admins invite members only", () => {
    expect(getInvitableWorkspaceRoles(WorkspaceRole.ADMIN)).toEqual([
      WorkspaceRole.MEMBER,
    ]);
    expect(
      canInviteWorkspaceRole(WorkspaceRole.ADMIN, WorkspaceRole.MEMBER)
    ).toBe(true);
    expect(
      canInviteWorkspaceRole(WorkspaceRole.ADMIN, WorkspaceRole.ADMIN)
    ).toBe(false);
    expect(
      canInviteWorkspaceRole(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    ).toBe(false);
  });

  it("blocks members from inviting anyone", () => {
    expect(getInvitableWorkspaceRoles(WorkspaceRole.MEMBER)).toEqual([]);
    expect(
      canInviteWorkspaceRole(WorkspaceRole.MEMBER, WorkspaceRole.MEMBER)
    ).toBe(false);
  });
});

describe("workspace invite token generation", () => {
  it("returns required non-empty tokens and keeps successive tokens unique", () => {
    const first = createWorkspaceInviteToken();
    const second = createWorkspaceInviteToken();

    expect(first.length).toBeGreaterThan(20);
    expect(second.length).toBeGreaterThan(20);
    expect(first).not.toBe(second);
  });
});
