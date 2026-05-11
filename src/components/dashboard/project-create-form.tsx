"use client";

import { useState, useTransition } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { createProjectAction } from "@/app/(dashboard)/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProjectCreateFormProps = {
  workspaceId: string;
  canManageProjects: boolean;
};

export function ProjectCreateForm({
  workspaceId,
  canManageProjects,
}: ProjectCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!canManageProjects) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
        Workspace members can review projects, but only owners and admins can add new
        ones.
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const result = await createProjectAction({
        workspaceId,
        name,
        description,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setName("");
      setDescription("");
      setSuccessMessage(result.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="project-name" className="text-sm font-medium">
          Project Name
        </label>
        <Input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example: Checkout Experience"
          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
          maxLength={80}
          required
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="project-description" className="text-sm font-medium">
          Project Description
        </label>
        <Textarea
          id="project-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What area of the product should this team route bugs into?"
          className="min-h-24 rounded-xl border-white/10 bg-white/[0.04]"
          maxLength={220}
        />
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
        >
          {successMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <FolderPlus className="mr-2 size-4" />
            Create Project
          </>
        )}
      </Button>
    </form>
  );
}
