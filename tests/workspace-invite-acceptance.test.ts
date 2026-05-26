import { InviteStatus, WorkspaceRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertCanManageWorkspaceInvitesMock,
  prismaTransactionMock,
  workspaceFindFirstMock,
  workspaceInviteCreateMock,
  workspaceInviteFindFirstMock,
  workspaceInviteFindUniqueMock,
  workspaceInviteUpdateManyMock,
  workspaceInviteUpdateMock,
} = vi.hoisted(() => ({
  assertCanManageWorkspaceInvitesMock: vi.fn(),
  prismaTransactionMock: vi.fn(),
  workspaceFindFirstMock: vi.fn(),
  workspaceInviteCreateMock: vi.fn(),
  workspaceInviteFindFirstMock: vi.fn(),
  workspaceInviteFindUniqueMock: vi.fn(),
  workspaceInviteUpdateManyMock: vi.fn(),
  workspaceInviteUpdateMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  assertCanManageWorkspaceInvites: assertCanManageWorkspaceInvitesMock,
  canInviteWorkspaceRole: (inviterRole: WorkspaceRole, invitedRole: WorkspaceRole) => {
    if (inviterRole === WorkspaceRole.OWNER) {
      return invitedRole === WorkspaceRole.ADMIN || invitedRole === WorkspaceRole.MEMBER;
    }

    if (inviterRole === WorkspaceRole.ADMIN) {
      return invitedRole === WorkspaceRole.MEMBER;
    }

    return false;
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      findFirst: workspaceFindFirstMock,
    },
    workspaceInvite: {
      updateMany: workspaceInviteUpdateManyMock,
      findFirst: workspaceInviteFindFirstMock,
      findUnique: workspaceInviteFindUniqueMock,
      create: workspaceInviteCreateMock,
      update: workspaceInviteUpdateMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

import {
  acceptWorkspaceInvite,
  createWorkspaceInvite,
} from "@/lib/data/workspace-invites";

const VALID_INVITE_TOKEN = "invite_token_1234567890";

type InviteAcceptanceTransaction = {
  workspaceInvite: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  workspaceMember: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  project: {
    findFirst: ReturnType<typeof vi.fn>;
  };
};

function buildPendingInvite(overrides?: Partial<{
  id: string;
  email: string;
  role: WorkspaceRole;
  status: InviteStatus;
  workspaceId: string;
  expiresAt: Date;
}>) {
  return {
    id: "invite-1",
    email: "invitee@example.com",
    role: WorkspaceRole.MEMBER,
    status: InviteStatus.PENDING,
    workspaceId: "workspace-1",
    expiresAt: new Date("2099-05-08T12:00:00.000Z"),
    ...overrides,
  };
}

describe("workspace invite creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    assertCanManageWorkspaceInvitesMock.mockResolvedValue({
      userId: "owner-1",
      role: WorkspaceRole.OWNER,
      workspace: {
        id: "workspace-1",
      },
    });
    workspaceInviteUpdateManyMock.mockResolvedValue({ count: 0 });
    workspaceFindFirstMock.mockResolvedValue(null);
    workspaceInviteFindFirstMock.mockResolvedValue(null);
    workspaceInviteCreateMock.mockResolvedValue({
      id: "invite-1",
      email: "teammate@example.com",
      role: WorkspaceRole.ADMIN,
      status: InviteStatus.PENDING,
      token: "token-1",
      workspaceId: "workspace-1",
      invitedById: "owner-1",
      invitedBy: {
        name: "Owner One",
        email: "owner@example.com",
      },
      expiresAt: new Date("2099-05-15T12:00:00.000Z"),
      createdAt: new Date("2099-05-08T12:00:00.000Z"),
      acceptedAt: null,
      revokedAt: null,
    });
  });

  it("prevents admins from inviting admins or owners", async () => {
    assertCanManageWorkspaceInvitesMock.mockResolvedValue({
      userId: "admin-1",
      role: WorkspaceRole.ADMIN,
      workspace: {
        id: "workspace-1",
      },
    });

    await expect(
      createWorkspaceInvite({
        workspaceId: "workspace-1",
        actorUserId: "admin-1",
        email: "teammate@example.com",
        role: WorkspaceRole.ADMIN,
      })
    ).rejects.toThrow("Workspace admins can only invite members.");
  });
});

describe("workspace invite acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceInviteUpdateManyMock.mockResolvedValue({ count: 0 });
  });

  it("requires a token before attempting acceptance", async () => {
    const result = await acceptWorkspaceInvite({
      token: "   ",
      authUserId: "user-1",
      authUserEmail: "invitee@example.com",
    });

    expect(result).toEqual({
      ok: false,
      error: "This invite link is invalid.",
    });
    expect(workspaceInviteFindUniqueMock).not.toHaveBeenCalled();
  });

  it("blocks acceptance when the signed-in email does not match the invite email", async () => {
    workspaceInviteFindUniqueMock.mockResolvedValue(buildPendingInvite());

    const result = await acceptWorkspaceInvite({
      token: VALID_INVITE_TOKEN,
      authUserId: "user-2",
      authUserEmail: "different@example.com",
    });

    expect(result).toEqual({
      ok: false,
      error:
        "This invite was sent to a different email address. Sign in with the invited email to continue.",
    });
    expect(prismaTransactionMock).not.toHaveBeenCalled();
  });

  it("rejects malformed invite tokens before querying the database", async () => {
    const result = await acceptWorkspaceInvite({
      token: "../not-a-valid-token",
      authUserId: "user-2",
      authUserEmail: "invitee@example.com",
    });

    expect(result).toEqual({
      ok: false,
      error: "This invite link is invalid.",
    });
    expect(workspaceInviteFindUniqueMock).not.toHaveBeenCalled();
    expect(prismaTransactionMock).not.toHaveBeenCalled();
  });

  it("blocks expired invites", async () => {
    workspaceInviteFindUniqueMock.mockResolvedValue(
      buildPendingInvite({
        expiresAt: new Date("2020-05-08T12:00:00.000Z"),
      })
    );

    const result = await acceptWorkspaceInvite({
      token: VALID_INVITE_TOKEN,
      authUserId: "user-2",
      authUserEmail: "invitee@example.com",
    });

    expect(result).toEqual({
      ok: false,
      error: "This invite has expired. Ask the workspace owner or admin for a new link.",
    });
  });

  it("blocks revoked invites", async () => {
    workspaceInviteFindUniqueMock.mockResolvedValue(
      buildPendingInvite({
        status: InviteStatus.REVOKED,
      })
    );

    const result = await acceptWorkspaceInvite({
      token: VALID_INVITE_TOKEN,
      authUserId: "user-2",
      authUserEmail: "invitee@example.com",
    });

    expect(result).toEqual({
      ok: false,
      error: "This invite has been revoked.",
    });
  });

  it("creates a workspace membership and marks the invite accepted", async () => {
    workspaceInviteFindUniqueMock.mockResolvedValue(buildPendingInvite());

    const txWorkspaceInviteFindUniqueMock = vi
      .fn()
      .mockResolvedValue(buildPendingInvite());
    const txWorkspaceMemberFindUniqueMock = vi.fn().mockResolvedValue(null);
    const txWorkspaceMemberCreateMock = vi.fn().mockResolvedValue({ id: "member-1" });
    const txWorkspaceInviteUpdateMock = vi.fn().mockResolvedValue({ id: "invite-1" });
    const txProjectFindFirstMock = vi.fn().mockResolvedValue({ id: "project-1" });

    prismaTransactionMock.mockImplementation(
      async (callback: (tx: InviteAcceptanceTransaction) => Promise<unknown>) =>
        callback({
          workspaceInvite: {
            findUnique: txWorkspaceInviteFindUniqueMock,
            update: txWorkspaceInviteUpdateMock,
          },
          workspaceMember: {
            findUnique: txWorkspaceMemberFindUniqueMock,
            create: txWorkspaceMemberCreateMock,
          },
          project: {
            findFirst: txProjectFindFirstMock,
          },
        })
    );

    const result = await acceptWorkspaceInvite({
      token: VALID_INVITE_TOKEN,
      authUserId: "user-2",
      authUserEmail: "invitee@example.com",
    });

    expect(result).toEqual({
      ok: true,
      workspaceId: "workspace-1",
      projectId: "project-1",
      alreadyMember: false,
    });
    expect(txWorkspaceMemberCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user-2",
        workspaceId: "workspace-1",
        role: WorkspaceRole.MEMBER,
      },
    });
    expect(txWorkspaceInviteUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
      },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedAt: expect.any(Date),
      },
    });
  });

  it("blocks duplicate membership creation while still consuming the invite safely", async () => {
    workspaceInviteFindUniqueMock.mockResolvedValue(buildPendingInvite());

    const txWorkspaceInviteFindUniqueMock = vi
      .fn()
      .mockResolvedValue(buildPendingInvite());
    const txWorkspaceMemberFindUniqueMock = vi
      .fn()
      .mockResolvedValue({ id: "member-1" });
    const txWorkspaceMemberCreateMock = vi.fn();
    const txWorkspaceInviteUpdateMock = vi.fn().mockResolvedValue({ id: "invite-1" });
    const txProjectFindFirstMock = vi.fn().mockResolvedValue({ id: "project-1" });

    prismaTransactionMock.mockImplementation(
      async (callback: (tx: InviteAcceptanceTransaction) => Promise<unknown>) =>
        callback({
          workspaceInvite: {
            findUnique: txWorkspaceInviteFindUniqueMock,
            update: txWorkspaceInviteUpdateMock,
          },
          workspaceMember: {
            findUnique: txWorkspaceMemberFindUniqueMock,
            create: txWorkspaceMemberCreateMock,
          },
          project: {
            findFirst: txProjectFindFirstMock,
          },
        })
    );

    const result = await acceptWorkspaceInvite({
      token: VALID_INVITE_TOKEN,
      authUserId: "user-2",
      authUserEmail: "invitee@example.com",
    });

    expect(result).toEqual({
      ok: true,
      workspaceId: "workspace-1",
      projectId: "project-1",
      alreadyMember: true,
    });
    expect(txWorkspaceMemberCreateMock).not.toHaveBeenCalled();
    expect(txWorkspaceInviteUpdateMock).toHaveBeenCalledOnce();
  });
});
