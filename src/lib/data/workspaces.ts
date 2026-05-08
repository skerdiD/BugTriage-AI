import "server-only";

import { Prisma, TicketStatus, WorkspaceRole } from "@prisma/client";

import {
  assertCanManageWorkspace,
  assertWorkspaceMember,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";

export const WORKSPACE_COOKIE_NAME = "bt_workspace_id";
export const PROJECT_COOKIE_NAME = "bt_project_id";
export const DEFAULT_PERSONAL_PROJECT_NAME = "Bug Intake";
export const DEFAULT_PERSONAL_PROJECT_DESCRIPTION =
  "Primary project for incoming bug reports, AI triage, screenshots, and engineering follow-up.";

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
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!existingMembership) {
    await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId,
        role: WorkspaceRole.OWNER,
      },
    });
    return;
  }

  if (existingMembership.role !== WorkspaceRole.OWNER) {
    await prisma.workspaceMember.update({
      where: {
        id: existingMembership.id,
      },
      data: {
        role: WorkspaceRole.OWNER,
      },
    });
  }
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
    project = await prisma.project.create({
      data: {
        workspaceId,
        name: DEFAULT_PERSONAL_PROJECT_NAME,
        slug: "bug-intake",
        description: DEFAULT_PERSONAL_PROJECT_DESCRIPTION,
      },
    });
  }

  return project;
}

export async function ensureUserWorkspace(input: EnsureWorkspaceInput) {
  const email = input.email ?? `${input.authUserId}@local.bugtriage.ai`;
  const name =
    input.name?.trim() ||
    email.split("@")[0]?.replace(/[._-]/g, " ") ||
    "BugTriage User";

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: input.authUserId }, { email }],
    },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email,
          name,
        },
      })
    : await prisma.user.create({
        data: {
          id: input.authUserId,
          email,
          name,
        },
      });

  let workspace = await prisma.workspace.findFirst({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!workspace) {
    const baseSlug = slugify(name) || "workspace";

    workspace = await prisma.workspace.create({
      data: {
        name: buildPersonalWorkspaceName(name),
        slug: `${baseSlug}-workspace-${user.id.slice(0, 8)}`,
        ownerId: user.id,
      },
    });
  }

  await ensureWorkspaceOwnerMembership(workspace.id, user.id);
  const project = await ensureDefaultProjectForWorkspace(workspace.id);

  return {
    user,
    workspace,
    project,
  };
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

export async function listWorkspaceProjects(workspaceId: string, userId?: string) {
  await assertWorkspaceMember(workspaceId, userId);

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
