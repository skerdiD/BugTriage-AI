"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  assertCanAccessProject,
  assertWorkspaceMember,
  AuthorizationError,
} from "@/lib/auth/authorization";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { DEMO_READ_ONLY_MESSAGE, isDemoUser } from "@/lib/demo";
import {
  createWorkspace,
  createWorkspaceProject,
  listWorkspaceProjects,
  pickCurrentProject,
  PROJECT_COOKIE_NAME,
  WORKSPACE_COOKIE_NAME,
  WorkspaceManagementError,
} from "@/lib/data/workspaces";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { resourceIdSchema } from "@/lib/validation/resource-identifiers";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const createProjectInputSchema = z.object({
  workspaceId: resourceIdSchema,
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

const createWorkspaceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters.")
    .max(80, "Workspace name must be less than 80 characters."),
});

export async function setCurrentWorkspaceAction(workspaceId: string) {
  const user = await getCurrentUserOrThrow();
  const parsedWorkspaceId = resourceIdSchema.safeParse(workspaceId);

  if (!parsedWorkspaceId.success) {
    return { ok: false as const };
  }

  const access = await assertWorkspaceMember(parsedWorkspaceId.data, user.id);
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
  const parsedProjectId = resourceIdSchema.safeParse(projectId);

  if (!parsedProjectId.success) {
    return { ok: false as const };
  }

  const access = await assertCanAccessProject(parsedProjectId.data, user.id);
  const cookieStore = await cookies();

  cookieStore.set(WORKSPACE_COOKIE_NAME, access.project.workspaceId, cookieOptions);
  cookieStore.set(PROJECT_COOKIE_NAME, access.project.id, cookieOptions);

  return { ok: true as const };
}

export async function createWorkspaceAction(input: { name: string }) {
  try {
    const user = await getCurrentUserOrThrow();
    if (isDemoUser(user)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }
    const parsed = createWorkspaceInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error:
          parsed.error.issues[0]?.message ??
          "Please review the workspace name and try again.",
      };
    }

    const workspace = await createWorkspace({
      name: parsed.data.name,
      actorUserId: user.id,
    });
    const projects = await listWorkspaceProjects(workspace.id, user.id);
    const selectedProject = pickCurrentProject(projects);
    const cookieStore = await cookies();

    cookieStore.set(WORKSPACE_COOKIE_NAME, workspace.id, cookieOptions);

    if (selectedProject) {
      cookieStore.set(PROJECT_COOKIE_NAME, selectedProject.id, cookieOptions);
    } else {
      cookieStore.delete(PROJECT_COOKIE_NAME);
    }

    return {
      ok: true as const,
      workspaceId: workspace.id,
      message: `${workspace.name} is ready for your team.`,
    };
  } catch (error) {
    if (error instanceof WorkspaceManagementError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "workspace",
      action: "create-workspace",
      message: "[workspace-actions] create workspace failed",
      context: {
        workspaceName: input.name,
      },
    });

    return {
      ok: false as const,
      error: "We couldn't create that workspace right now. Please try again.",
    };
  }
}

export async function createProjectAction(input: {
  workspaceId: string;
  name: string;
  description?: string;
}) {
  try {
    const user = await getCurrentUserOrThrow();
    if (isDemoUser(user)) {
      return { ok: false as const, error: DEMO_READ_ONLY_MESSAGE };
    }
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
      message: `${project.name} is ready for incoming reports.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    if (error instanceof WorkspaceManagementError) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    captureServerException(error, {
      area: "workspace",
      action: "create-project",
      message: "[workspace-actions] create project failed",
      context: {
        workspaceId: input.workspaceId,
      },
    });

    return {
      ok: false as const,
      error: "We couldn't create that project right now. Please try again.",
    };
  }
}
