import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { ensureUserWorkspace } from "@/lib/data/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeNameFromUserMetadata(metadata: User["user_metadata"]) {
  const fullName = metadata?.full_name;
  const name = metadata?.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;

  return null;
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export const getCurrentUserOrThrow = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError("You must be signed in to continue.");
  }

  return user;
});

export const getCurrentDashboardUser = cache(async () => {
  let user: User;

  try {
    user = await getCurrentUserOrThrow();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }

    throw error;
  }

  const displayName =
    normalizeNameFromUserMetadata(user.user_metadata) ??
    user.email?.split("@")[0] ??
    "User";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: user.id,
    name: displayName,
    email: user.email ?? "No email",
    initials,
  };
});

export const getCurrentWorkspaceContextOrThrow = cache(async () => {
  const user = await getCurrentUserOrThrow();

  return ensureUserWorkspace({
    authUserId: user.id,
    email: user.email,
    name: normalizeNameFromUserMetadata(user.user_metadata),
  });
});

export const getCurrentWorkspaceContextOrRedirect = cache(async () => {
  try {
    return await getCurrentWorkspaceContextOrThrow();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }

    throw error;
  }
});
