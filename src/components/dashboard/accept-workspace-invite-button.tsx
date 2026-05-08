"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { acceptWorkspaceInviteAction } from "@/app/invite/[token]/actions";
import { Button } from "@/components/ui/button";

type AcceptWorkspaceInviteButtonProps = {
  token: string;
};

export function AcceptWorkspaceInviteButton({
  token,
}: AcceptWorkspaceInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  function handleAccept() {
    setErrorMessage("");

    startTransition(async () => {
      const result = await acceptWorkspaceInviteAction({ token });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        disabled={isPending}
        onClick={handleAccept}
        className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Accepting...
          </>
        ) : (
          <>
            Accept Invite
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
      {errorMessage ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
