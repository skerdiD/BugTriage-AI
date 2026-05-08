import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getCurrentDashboardUser,
  getCurrentWorkspaceContextOrRedirect,
} from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dashboardUser = await getCurrentDashboardUser();
  const workspaceContext = await getCurrentWorkspaceContextOrRedirect();

  return (
    <DashboardShell
      user={dashboardUser}
      workspace={workspaceContext.workspace}
      project={workspaceContext.project}
      workspaces={workspaceContext.availableWorkspaces}
      projects={workspaceContext.availableProjects}
    >
      {children}
    </DashboardShell>
  );
}
