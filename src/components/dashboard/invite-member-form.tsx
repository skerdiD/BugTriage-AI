"use client";

import { useState, useTransition } from "react";
import { Loader2, MailPlus, Sparkles } from "lucide-react";
import { WorkspaceRole } from "@prisma/client";
import { useRouter } from "next/navigation";

import { createWorkspaceInviteAction } from "@/app/(dashboard)/team/actions";
import { CopyInviteLinkButton } from "@/components/dashboard/copy-invite-link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InviteMemberFormProps = {
  workspaceId: string;
  roleOptions: WorkspaceRole[];
};

const roleDescriptions: Record<WorkspaceRole, string> = {
  OWNER: "Full control of the workspace.",
  ADMIN: "Can help manage projects and teammates.",
  MEMBER: "Can triage and collaborate inside the workspace.",
};

export function InviteMemberForm({
  workspaceId,
  roleOptions,
}: InviteMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>(roleOptions[0] ?? WorkspaceRole.MEMBER);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const result = await createWorkspaceInviteAction({
        workspaceId,
        email,
        role,
      });

      if (!result.ok) {
        setInviteLink("");
        setErrorMessage(result.error);
        return;
      }

      setEmail("");
      setRole(roleOptions[0] ?? WorkspaceRole.MEMBER);
      setInviteLink(result.inviteLink);
      setSuccessMessage(result.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Teammate Email</label>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="engineer@company.com"
          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
          maxLength={120}
          autoComplete="email"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Workspace Role</label>
        <Select value={role} onValueChange={(value) => setRole(value as WorkspaceRole)}>
          <SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-white/[0.04]">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs leading-5 text-muted-foreground">
          {roleDescriptions[role]}
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <p>{successMessage}</p>
          </div>
          {inviteLink ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="break-all font-mono text-xs text-white/90">{inviteLink}</p>
              <div className="mt-3">
                <CopyInviteLinkButton inviteLink={inviteLink} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Creating Invite...
          </>
        ) : (
          <>
            <MailPlus className="mr-2 size-4" />
            Create Invite Link
          </>
        )}
      </Button>
    </form>
  );
}
