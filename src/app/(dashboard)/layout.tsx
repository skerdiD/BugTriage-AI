import { Suspense } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardShellSkeleton } from "@/components/dashboard/dashboard-shell-skeleton";
import {
  getCurrentDashboardUser,
  getCurrentWorkspaceContextOrRedirect,
} from "@/lib/auth/session";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthenticatedDashboardShell>{children}</AuthenticatedDashboardShell>
    </Suspense>
  );
}

async function AuthenticatedDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dashboardUser, workspaceContext] = await Promise.all([
    getCurrentDashboardUser(),
    getCurrentWorkspaceContextOrRedirect(),
  ]);

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
