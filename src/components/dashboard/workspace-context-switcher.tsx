"use client";

import { useTransition } from "react";
import { FolderKanban, Loader2, Orbit, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  setCurrentProjectAction,
  setCurrentWorkspaceAction,
} from "@/app/(dashboard)/workspace-actions";
import type {
  ProjectSummary,
  WorkspaceSummary,
} from "@/lib/data/workspaces";

type WorkspaceContextSwitcherProps = {
  roleLabel: string;
  currentWorkspaceId: string;
  currentProjectId: string | null;
  workspaces: WorkspaceSummary[];
  projects: ProjectSummary[];
};

export function WorkspaceContextSwitcher({
  roleLabel,
  currentWorkspaceId,
  currentProjectId,
  workspaces,
  projects,
}: WorkspaceContextSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleWorkspaceChange(nextWorkspaceId: string) {
    startTransition(async () => {
      await setCurrentWorkspaceAction(nextWorkspaceId);
      router.refresh();
    });
  }

  function handleProjectChange(nextProjectId: string) {
    startTransition(async () => {
      await setCurrentProjectAction(nextProjectId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 border-b border-white/10 px-4 py-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Orbit className="size-3.5" />
          Active Context
          {isPending ? <Loader2 className="ml-auto size-3.5 animate-spin" /> : null}
        </div>

        <div className="mt-3 space-y-3">
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-white">
              <Users className="size-3.5 text-violet-300" />
              Workspace
            </span>
            <select
              value={currentWorkspaceId}
              onChange={(event) => handleWorkspaceChange(event.target.value)}
              disabled={isPending}
              className="h-10 rounded-xl border border-white/10 bg-[#171724] px-3 text-sm text-white outline-none transition focus:border-violet-400"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} · {workspace.role}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-white">
              <FolderKanban className="size-3.5 text-sky-300" />
              Project
            </span>
            <select
              value={currentProjectId ?? ""}
              onChange={(event) => handleProjectChange(event.target.value)}
              disabled={isPending || projects.length === 0}
              className="h-10 rounded-xl border border-white/10 bg-[#171724] px-3 text-sm text-white outline-none transition focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {projects.length === 0 ? (
                <option value="">No projects yet</option>
              ) : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Signed in with <span className="font-medium text-white">{roleLabel}</span>{" "}
          access in the selected workspace.
        </p>
      </div>
    </div>
  );
}
