import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let dashboardUser: {
    id: string;
    name: string;
    email: string;
    initials: string;
  };

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const displayName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : user.email?.split("@")[0] ?? "User";

    const initials = displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    dashboardUser = {
      id: user.id,
      name: displayName,
      email: user.email ?? "No email",
      initials,
    };
  } catch {
    redirect("/login");
  }

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
