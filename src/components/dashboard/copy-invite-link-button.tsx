"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyInviteLinkButtonProps = {
  inviteLink: string;
};

export function CopyInviteLinkButton({
  inviteLink,
}: CopyInviteLinkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"idle" | "copied" | "error">("idle");

  function handleCopy() {
    setFeedback("idle");

    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setFeedback("copied");
      } catch {
        setFeedback("error");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={handleCopy}
        className="rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Copying...
          </>
        ) : feedback === "copied" ? (
          <>
            <Check className="mr-2 size-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-2 size-4" />
            Copy Invite Link
          </>
        )}
      </Button>
      {feedback === "error" ? (
        <p className="text-xs text-red-200">
          Copy failed on this browser. You can still copy the link manually.
        </p>
      ) : null}
    </div>
  );
}
