"use client";

import { useState, useTransition } from "react";
import { AlertCircle, FolderKanban, Loader2, Orbit, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  setCurrentProjectAction,
  setCurrentWorkspaceAction,
} from "@/app/(dashboard)/workspace-actions";
import type {
  ProjectSummary,
  WorkspaceSummary,
} from "@/lib/data/workspaces";
import { formatWorkspaceRole } from "@/lib/utils";

type WorkspaceContextSwitcherProps = {
  roleLabel: string;
  currentWorkspaceId: string;
  currentProjectId: string | null;
  workspaces: WorkspaceSummary[];
  projects: ProjectSummary[];
};

function roleBadgeClass(role: string) {
  if (role === "OWNER") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-300";
  }

  if (role === "ADMIN") {
    return "border-sky-500/25 bg-sky-500/15 text-sky-300";
  }

  return "border-violet-500/25 bg-violet-500/15 text-violet-300";
}

export function WorkspaceContextSwitcher({
  roleLabel,
  currentWorkspaceId,
  currentProjectId,
  workspaces,
  projects,
}: WorkspaceContextSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  function handleWorkspaceChange(nextWorkspaceId: string) {
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = await setCurrentWorkspaceAction(nextWorkspaceId);

        if (!result.ok) {
          setErrorMessage(
            "That workspace is no longer available. Refreshing your access..."
          );
        }
      } catch {
        setErrorMessage(
          "We couldn't switch workspaces. Your previous selection is still active."
        );
      } finally {
        router.refresh();
      }
    });
  }

  function handleProjectChange(nextProjectId: string) {
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = await setCurrentProjectAction(nextProjectId);

        if (!result.ok) {
          setErrorMessage(
            "That project is no longer available. Refreshing your access..."
          );
        }
      } catch {
        setErrorMessage(
          "We couldn't switch projects. Your previous selection is still active."
        );
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full xl:w-auto xl:max-w-[720px]">
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-[0_20px_50px_-42px_rgba(0,0,0,0.95)] backdrop-blur sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] sm:items-end">
        <div className="grid min-w-0 gap-1">
          <label
            htmlFor="workspace-switcher-workspace"
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            <Users className="size-3.5 text-violet-300" />
            Workspace
          </label>
          <select
            id="workspace-switcher-workspace"
            value={currentWorkspaceId}
            onChange={(event) => handleWorkspaceChange(event.target.value)}
            disabled={isPending}
            className="h-10 w-full min-w-0 rounded-xl border border-white/10 bg-[#171724] px-3 pr-8 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] hover:border-white/15 focus:border-violet-400 focus:ring-3 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-w-0 gap-1">
          <label
            htmlFor="workspace-switcher-project"
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            <FolderKanban className="size-3.5 text-sky-300" />
            Project
          </label>
          <select
            id="workspace-switcher-project"
            value={currentProjectId ?? ""}
            onChange={(event) => handleProjectChange(event.target.value)}
            disabled={isPending || projects.length === 0}
            className="h-10 w-full min-w-0 rounded-xl border border-white/10 bg-[#171724] px-3 pr-8 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] hover:border-white/15 focus:border-violet-400 focus:ring-3 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>

        <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:mb-1 sm:justify-start sm:pl-1">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${roleBadgeClass(
              roleLabel
            )}`}
          >
            {formatWorkspaceRole(roleLabel)}
          </span>
          <div className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-muted-foreground">
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Orbit className="size-3.5" />
            )}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
    </div>
  );
}
