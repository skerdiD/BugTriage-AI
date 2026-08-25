"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateProfileNameAction } from "@/app/(dashboard)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileNameFormProps = {
  currentName: string;
};

export function ProfileNameForm({ currentName }: ProfileNameFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateProfileNameAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Display name</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={currentName}
          minLength={2}
          maxLength={80}
          disabled={isPending}
          className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {message ? (
        <p
          role="status"
          className="inline-flex items-center gap-2 text-sm text-emerald-200"
        >
          <CheckCircle2 className="size-4" />
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-violet-600 px-4 shadow-lg shadow-violet-500/20 hover:bg-violet-500"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 size-4" />
            Save name
          </>
        )}
      </Button>
    </form>
  );
}
