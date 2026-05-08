import "server-only";

import { prisma } from "@/lib/prisma";

type EnsureWorkspaceInput = {
  authUserId: string;
  email?: string | null;
  name?: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
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
    const baseSlug = slugify(`${name}-workspace`) || "workspace";

    workspace = await prisma.workspace.create({
      data: {
        name: "BugTriage Workspace",
        slug: `${baseSlug}-${user.id.slice(0, 8)}`,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });
  }

  let project = await prisma.project.findFirst({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: "Core SaaS Platform",
        slug: "core-saas-platform",
        description:
          "Default project for AI-triaged bug reports, screenshots, logs, and engineering tickets.",
      },
    });
  }

  return {
    user,
    workspace,
    project,
  };
}
