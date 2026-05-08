"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type InviteSignOutButtonProps = {
  redirectedFrom: string;
};

export function InviteSignOutButton({
  redirectedFrom,
}: InviteSignOutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push(`/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={handleSignOut}
      className="h-11 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="mr-2 size-4" />
          Sign out to switch account
        </>
      )}
    </Button>
  );
}
