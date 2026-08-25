"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, UserMinus } from "lucide-react";
import { WorkspaceRole } from "@prisma/client";
import { useRouter } from "next/navigation";

import {
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
} from "@/app/(dashboard)/team/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatWorkspaceRole } from "@/lib/utils";

type WorkspaceMemberControlsProps = {
  workspaceId: string;
  memberId: string;
  memberName: string;
  currentRole: WorkspaceRole;
  availableRoles: WorkspaceRole[];
  canRemove: boolean;
};

export function WorkspaceMemberControls({
  workspaceId,
  memberId,
  memberName,
  currentRole,
  availableRoles,
  canRemove,
}: WorkspaceMemberControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(currentRole);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canChangeRole = availableRoles.length > 0;

  function handleRoleSave() {
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const result = await updateWorkspaceMemberRoleAction({
        workspaceId,
        memberId,
        role: selectedRole,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage(result.message);
      router.refresh();
    });
  }

  function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${memberName} from this workspace? They will lose access immediately.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const result = await removeWorkspaceMemberAction({
        workspaceId,
        memberId,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Workspace access
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as WorkspaceRole)}
          disabled={isPending || !canChangeRole}
        >
          <SelectTrigger
            aria-label={`Role for ${memberName}`}
            className="h-10 w-full rounded-xl border-white/10 bg-white/[0.04] sm:max-w-[220px]"
          >
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {formatWorkspaceRole(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleRoleSave}
            disabled={isPending || !canChangeRole}
            className="h-10 rounded-xl bg-sky-600 hover:bg-sky-500"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save role
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={isPending || !canRemove}
            className="h-10 rounded-xl border-red-500/20 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
          >
            <UserMinus className="mr-2 size-4" />
            Remove
          </Button>
        </div>
      </div>

      {!canChangeRole ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Your current role does not allow you to change this person&apos;s access.
        </p>
      ) : null}

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
    </div>
  );
}
