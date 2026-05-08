"use server";

import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

import {
  assertCanAccessProject,
  assertWorkspaceMember,
  AuthorizationError,
} from "@/lib/auth/authorization";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import {
  createWorkspaceProject,
  listWorkspaceProjects,
  pickCurrentProject,
  PROJECT_COOKIE_NAME,
  WORKSPACE_COOKIE_NAME,
} from "@/lib/data/workspaces";
import { getSafeErrorMessage } from "@/lib/security/redaction";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const createProjectInputSchema = z.object({
  workspaceId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters.")
    .max(80, "Project name must be less than 80 characters."),
  description: z
    .string()
    .trim()
    .max(220, "Project description must be less than 220 characters.")
    .optional()
    .or(z.literal("")),
});

export async function setCurrentWorkspaceAction(workspaceId: string) {
  const user = await getCurrentUserOrThrow();
  const access = await assertWorkspaceMember(workspaceId, user.id);
  const cookieStore = await cookies();
  const projects = await listWorkspaceProjects(access.workspace.id, user.id);
  const selectedProject = pickCurrentProject(projects);

  cookieStore.set(WORKSPACE_COOKIE_NAME, access.workspace.id, cookieOptions);

  if (selectedProject) {
    cookieStore.set(PROJECT_COOKIE_NAME, selectedProject.id, cookieOptions);
  } else {
    cookieStore.delete(PROJECT_COOKIE_NAME);
  }

  return { ok: true as const };
}

export async function setCurrentProjectAction(projectId: string) {
  const user = await getCurrentUserOrThrow();
  const access = await assertCanAccessProject(projectId, user.id);
  const cookieStore = await cookies();

  cookieStore.set(WORKSPACE_COOKIE_NAME, access.project.workspaceId, cookieOptions);
  cookieStore.set(PROJECT_COOKIE_NAME, access.project.id, cookieOptions);

  return { ok: true as const };
}

export async function createProjectAction(input: {
  workspaceId: string;
  name: string;
  description?: string;
}) {
  try {
    const user = await getCurrentUserOrThrow();
    const parsed = createProjectInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error:
          parsed.error.issues[0]?.message ??
          "Please review the project details and try again.",
      };
    }

    const project = await createWorkspaceProject({
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      description: parsed.data.description,
      actorUserId: user.id,
    });

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, project.workspaceId, cookieOptions);
    cookieStore.set(PROJECT_COOKIE_NAME, project.id, cookieOptions);

    return {
      ok: true as const,
      projectId: project.id,
      projectName: project.name,
      message: `${project.name} is ready for incoming bug tickets.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    Sentry.captureException(error, {
      tags: {
        area: "workspace",
        action: "create-project",
      },
      extra: {
        workspaceId: input.workspaceId,
      },
    });
    console.error("[workspace-actions] create project failed", getSafeErrorMessage(error));

    return {
      ok: false as const,
      error: "We couldn't create that project right now. Please try again.",
    };
  }
}
