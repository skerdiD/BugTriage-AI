"use client";

import { useState, useTransition } from "react";
import { Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { revokeWorkspaceInviteAction } from "@/app/(dashboard)/team/actions";
import { Button } from "@/components/ui/button";

type RevokeInviteButtonProps = {
  workspaceId: string;
  inviteId: string;
};

export function RevokeInviteButton({
  workspaceId,
  inviteId,
}: RevokeInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  function handleRevoke() {
    setErrorMessage("");

    startTransition(async () => {
      const result = await revokeWorkspaceInviteAction({
        workspaceId,
        inviteId,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={handleRevoke}
        className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Revoking...
          </>
        ) : (
          <>
            <Ban className="mr-2 size-4" />
            Revoke
          </>
        )}
      </Button>
      {errorMessage ? (
        <p role="alert" className="text-xs text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
