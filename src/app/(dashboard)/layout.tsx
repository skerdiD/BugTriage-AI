import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentDashboardUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dashboardUser = await getCurrentDashboardUser();

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
