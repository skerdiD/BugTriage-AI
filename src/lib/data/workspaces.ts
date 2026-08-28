import "server-only";

import { Prisma, TicketStatus, WorkspaceRole } from "@prisma/client";

import {
  assertCanManageWorkspace,
  assertWorkspaceMember,
  canManageWorkspaceMemberRole,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";

export const WORKSPACE_COOKIE_NAME = "bt_workspace_id";
export const PROJECT_COOKIE_NAME = "bt_project_id";
export const DEFAULT_PERSONAL_PROJECT_NAME = "Bug Intake";
export const DEFAULT_PERSONAL_PROJECT_DESCRIPTION =
  "Default home for incoming reports, private evidence, AI triage, and engineering follow-up.";

type EnsureWorkspaceInput = {
  authUserId: string;
  email?: string | null;
  name?: string | null;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  role: WorkspaceRole;
  memberCount: number;
  projectCount: number;
  ticketCount: number;
  createdAt: Date;
};

export type ProjectSummary = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  ticketCount: number;
  createdAt: Date;
};

export type WorkspaceMemberSummary = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  isOwner: boolean;
  joinedAt: Date;
  openAssignedTicketCount: number;
  reportedTicketCount: number;
};

export class WorkspaceManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceManagementError";
  }
}

const workspaceQuerySelect = {
  id: true,
  name: true,
  slug: true,
  ownerId: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  members: {
    select: {
      userId: true,
      role: true,
    },
  },
  _count: {
    select: {
      members: true,
      projects: true,
      tickets: true,
    },
  },
} satisfies Prisma.WorkspaceSelect;

function workspaceRoleRank(role: WorkspaceRole) {
  const rank: Record<WorkspaceRole, number> = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  };

  return rank[role];
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function buildPersonalWorkspaceName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "My Workspace";
  }

  return `${trimmedName} Workspace`;
}

function buildWorkspaceSummary(
  workspace: Prisma.WorkspaceGetPayload<{ select: typeof workspaceQuerySelect }>,
  currentUserId: string
): WorkspaceSummary {
  const memberRecord = workspace.members.find(
    (member) => member.userId === currentUserId
  );
  const includesOwnerMembership = workspace.members.some(
    (member) => member.userId === workspace.ownerId
  );

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerId: workspace.ownerId,
    ownerName: workspace.owner.name,
    ownerEmail: workspace.owner.email,
    role:
      workspace.ownerId === currentUserId
        ? WorkspaceRole.OWNER
        : (memberRecord?.role ?? WorkspaceRole.MEMBER),
    memberCount: workspace._count.members + (includesOwnerMembership ? 0 : 1),
    projectCount: workspace._count.projects,
    ticketCount: workspace._count.tickets,
    createdAt: workspace.createdAt,
  };
}

export function pickCurrentWorkspace(
  workspaces: WorkspaceSummary[],
  preferredWorkspaceId?: string | null
) {
  if (workspaces.length === 0) {
    return null;
  }

  if (preferredWorkspaceId) {
    const matchingWorkspace = workspaces.find(
      (workspace) => workspace.id === preferredWorkspaceId
    );

    if (matchingWorkspace) {
      return matchingWorkspace;
    }
  }

  return workspaces[0];
}

export function pickCurrentProject(
  projects: ProjectSummary[],
  preferredProjectId?: string | null
) {
  if (projects.length === 0) {
    return null;
  }

  if (preferredProjectId) {
    const matchingProject = projects.find(
      (project) => project.id === preferredProjectId
    );

    if (matchingProject) {
      return matchingProject;
    }
  }

  return projects[0];
}

async function ensureWorkspaceOwnerMembership(workspaceId: string, userId: string) {
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    create: {
      userId,
      workspaceId,
      role: WorkspaceRole.OWNER,
    },
    update: {
      role: WorkspaceRole.OWNER,
    },
  });
}

async function ensureDefaultProjectForWorkspace(workspaceId: string) {
  let project = await prisma.project.findFirst({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!project) {
    project = await prisma.project.upsert({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: "bug-intake",
        },
      },
      create: {
        workspaceId,
        name: DEFAULT_PERSONAL_PROJECT_NAME,
        slug: "bug-intake",
        description: DEFAULT_PERSONAL_PROJECT_DESCRIPTION,
      },
      update: {
        name: DEFAULT_PERSONAL_PROJECT_NAME,
        description: DEFAULT_PERSONAL_PROJECT_DESCRIPTION,
      },
    });
  }

  return project;
}

async function buildUniqueWorkspaceSlug(name: string) {
  const baseSlug = slugify(name) || "workspace";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const slug = `${baseSlug}${suffix}`.slice(0, 60);

    const existingWorkspace = await prisma.workspace.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existingWorkspace) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now().toString().slice(-4)}`.slice(0, 60);
}

export async function ensureUserWorkspace(input: EnsureWorkspaceInput) {
  const email = input.email ?? `${input.authUserId}@local.bugtriage.ai`;
  const name =
    input.name?.trim() ||
    email.split("@")[0]?.replace(/[._-]/g, " ") ||
    "BugTriage User";

  const existingUserByAuthId = await prisma.user.findUnique({
    where: {
      id: input.authUserId,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const user = existingUserByAuthId
    ? existingUserByAuthId.email === email &&
      existingUserByAuthId.name === name
      ? existingUserByAuthId
      : await prisma.user.update({
          where: { id: existingUserByAuthId.id },
          data: {
            email,
            name,
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        })
    : await prisma.user.upsert({
        where: {
          email,
        },
        create: {
          id: input.authUserId,
          email,
          name,
        },
        update: {
          id: input.authUserId,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

  let workspace = await prisma.workspace.findFirst({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      ownerId: true,
      _count: {
        select: {
          projects: true,
        },
      },
    },
  });

  if (!workspace) {
    const authUserSlug = slugify(user.id) || user.id.slice(0, 48);
    const personalWorkspaceId = `personal-${user.id}`;

    const provisionedWorkspace = await prisma.workspace.upsert({
      where: {
        id: personalWorkspaceId,
      },
      create: {
        id: personalWorkspaceId,
        name: buildPersonalWorkspaceName(name),
        slug: `personal-${authUserSlug}`,
        ownerId: user.id,
      },
      update: {
        name: buildPersonalWorkspaceName(name),
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (provisionedWorkspace.ownerId !== user.id) {
      throw new WorkspaceManagementError(
        "A personal workspace could not be provisioned for this account."
      );
    }

    workspace = await prisma.workspace.findUnique({
      where: {
        id: provisionedWorkspace.id,
      },
      select: {
        id: true,
        ownerId: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new WorkspaceManagementError(
        "The personal workspace was provisioned, but it could not be loaded."
      );
    }
  }

  await ensureWorkspaceOwnerMembership(workspace.id, user.id);
  const project =
    workspace._count.projects > 0
      ? await prisma.project.findFirst({
          where: {
            workspaceId: workspace.id,
          },
          orderBy: {
            createdAt: "asc",
          },
        })
      : await ensureDefaultProjectForWorkspace(workspace.id);

  return {
    user,
    workspace,
    project,
  };
}

export async function createWorkspace(input: {
  name: string;
  actorUserId: string;
}) {
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    throw new WorkspaceManagementError("Workspace name is required.");
  }

  const actor = await prisma.user.findUnique({
    where: {
      id: input.actorUserId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!actor) {
    throw new WorkspaceManagementError(
      "Your account is not ready to create a workspace yet."
    );
  }

  const slug = await buildUniqueWorkspaceSlug(normalizedName);
  const workspace = await prisma.workspace.create({
    data: {
      name: normalizedName,
      slug,
      ownerId: actor.id,
    },
    select: workspaceQuerySelect,
  });

  await ensureWorkspaceOwnerMembership(workspace.id, actor.id);
  await ensureDefaultProjectForWorkspace(workspace.id);

  const hydratedWorkspace = await prisma.workspace.findUnique({
    where: {
      id: workspace.id,
    },
    select: workspaceQuerySelect,
  });

  if (!hydratedWorkspace) {
    throw new WorkspaceManagementError(
      "The new workspace was created, but it could not be loaded afterward."
    );
  }

  return buildWorkspaceSummary(hydratedWorkspace, actor.id);
}

export async function listUserWorkspaces(userId: string) {
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
    select: workspaceQuerySelect,
  });

  return workspaces
    .map((workspace) => buildWorkspaceSummary(workspace, userId))
    .sort((a, b) => {
      const roleDelta = workspaceRoleRank(b.role) - workspaceRoleRank(a.role);

      if (roleDelta !== 0) {
        return roleDelta;
      }

      return a.name.localeCompare(b.name);
    });
}

export async function listWorkspaceProjects(
  workspaceId: string,
  userId?: string,
  options?: {
    skipAccessCheck?: boolean;
  }
) {
  if (!options?.skipAccessCheck) {
    await assertWorkspaceMember(workspaceId, userId);
  }

  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return projects.map((project) => ({
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    ticketCount: project._count.tickets,
    createdAt: project.createdAt,
  }));
}

async function buildUniqueProjectSlug(workspaceId: string, name: string) {
  const baseSlug = slugify(name) || "project";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const slug = `${baseSlug}${suffix}`.slice(0, 60);

    const existingProject = await prisma.project.findFirst({
      where: {
        workspaceId,
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existingProject) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now().toString().slice(-4)}`.slice(0, 60);
}

export async function createWorkspaceProject(input: {
  workspaceId: string;
  name: string;
  description?: string | null;
  actorUserId?: string;
}) {
  const access = await assertCanManageWorkspace(
    input.workspaceId,
    input.actorUserId
  );
  const slug = await buildUniqueProjectSlug(input.workspaceId, input.name);

  const project = await prisma.project.create({
    data: {
      workspaceId: access.workspace.id,
      name: input.name,
      slug,
      description: input.description?.trim() || null,
    },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          tickets: true,
        },
      },
    },
  });

  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    ticketCount: project._count.tickets,
    createdAt: project.createdAt,
  } satisfies ProjectSummary;
}

export async function getWorkspaceMembers(workspaceId: string, userId?: string) {
  const access = await assertWorkspaceMember(workspaceId, userId);

  const [workspaceOwner, memberships, openAssignedCounts, reportedCounts] = await prisma.$transaction([
    prisma.user.findUnique({
      where: {
        id: access.workspace.ownerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        workspaceId,
        assigneeId: {
          not: null,
        },
        status: {
          notIn: [TicketStatus.FIXED, TicketStatus.CLOSED],
        },
      },
      orderBy: {
        assigneeId: "asc",
      },
      _count: {
        assigneeId: true,
      },
    }),
    prisma.ticket.groupBy({
      by: ["reporterId"],
      where: {
        workspaceId,
        reporterId: {
          not: null,
        },
      },
      orderBy: {
        reporterId: "asc",
      },
      _count: {
        reporterId: true,
      },
    }),
  ]);

  const openAssignedMap = new Map(
    openAssignedCounts
      .filter((entry) => entry.assigneeId)
      .map((entry) => [
        entry.assigneeId as string,
        Number(
          typeof entry._count === "object" && entry._count
            ? entry._count.assigneeId ?? 0
            : 0
        ),
      ])
  );
  const reportedMap = new Map(
    reportedCounts
      .filter((entry) => entry.reporterId)
      .map((entry) => [
        entry.reporterId as string,
        Number(
          typeof entry._count === "object" && entry._count
            ? entry._count.reporterId ?? 0
            : 0
        ),
      ])
  );
  const normalizedMemberships = [...memberships];

  if (
    workspaceOwner &&
    !normalizedMemberships.some((membership) => membership.userId === workspaceOwner.id)
  ) {
    normalizedMemberships.push({
      id: `owner-${workspaceOwner.id}`,
      userId: workspaceOwner.id,
      role: WorkspaceRole.OWNER,
      joinedAt: new Date(0),
      user: workspaceOwner,
    });
  }

  return normalizedMemberships
    .map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      name: membership.user.name,
      email: membership.user.email,
      role:
        membership.userId === access.workspace.ownerId
          ? WorkspaceRole.OWNER
          : membership.role,
      isOwner: membership.userId === access.workspace.ownerId,
      joinedAt: membership.joinedAt,
      openAssignedTicketCount: openAssignedMap.get(membership.userId) ?? 0,
      reportedTicketCount: reportedMap.get(membership.userId) ?? 0,
    }))
    .sort((a, b) => {
      const roleDelta = workspaceRoleRank(b.role) - workspaceRoleRank(a.role);

      if (roleDelta !== 0) {
        return roleDelta;
      }

      return a.name.localeCompare(b.name);
    });
}

export async function updateWorkspaceMemberRole(input: {
  workspaceId: string;
  memberId: string;
  nextRole: WorkspaceRole;
  actorUserId?: string;
}) {
  const access = await assertCanManageWorkspace(
    input.workspaceId,
    input.actorUserId
  );
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      id: input.memberId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      role: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!membership) {
    throw new WorkspaceManagementError(
      "That workspace member could not be found."
    );
  }

  if (membership.userId === access.workspace.ownerId) {
    throw new WorkspaceManagementError(
      "The workspace owner role cannot be changed here."
    );
  }

  if (!canManageWorkspaceMemberRole(access.role, membership.role)) {
    throw new WorkspaceManagementError(
      "You do not have permission to change that teammate's role."
    );
  }

  if (!canManageWorkspaceMemberRole(access.role, input.nextRole)) {
    throw new WorkspaceManagementError(
      access.role === WorkspaceRole.ADMIN
        ? "Workspace admins can only assign the member role."
        : "That role change is not allowed."
    );
  }

  if (membership.role === input.nextRole) {
    return {
      memberName: membership.user.name,
      role: membership.role,
    };
  }

  const updatedMembership = await prisma.workspaceMember.update({
    where: {
      id: membership.id,
    },
    data: {
      role: input.nextRole,
    },
    select: {
      role: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    memberName: updatedMembership.user.name,
    role: updatedMembership.role,
  };
}

export async function removeWorkspaceMember(input: {
  workspaceId: string;
  memberId: string;
  actorUserId?: string;
}) {
  const access = await assertCanManageWorkspace(
    input.workspaceId,
    input.actorUserId
  );
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      id: input.memberId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      role: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!membership) {
    throw new WorkspaceManagementError(
      "That workspace member could not be found."
    );
  }

  if (membership.userId === access.workspace.ownerId) {
    throw new WorkspaceManagementError(
      "The workspace owner cannot be removed."
    );
  }

  if (!canManageWorkspaceMemberRole(access.role, membership.role)) {
    throw new WorkspaceManagementError(
      "You do not have permission to remove that teammate."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticket.updateMany({
      where: {
        workspaceId: input.workspaceId,
        assigneeId: membership.userId,
      },
      data: {
        assigneeId: null,
      },
    });

    await tx.workspaceMember.delete({
      where: {
        id: membership.id,
      },
    });
  });

  return {
    memberName: membership.user.name,
  };
}
