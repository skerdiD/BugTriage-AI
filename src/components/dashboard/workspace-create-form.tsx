"use client";

import { useState, useTransition } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { createWorkspaceAction } from "@/app/(dashboard)/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkspaceCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const result = await createWorkspaceAction({ name });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setName("");
      setSuccessMessage(result.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Workspace Name</label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example: Growth Engineering"
          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
          maxLength={80}
          required
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
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
            Creating Workspace...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 size-4" />
            Create Workspace
          </>
        )}
      </Button>
    </form>
  );
}
