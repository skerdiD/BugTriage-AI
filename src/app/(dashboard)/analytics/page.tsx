import { AnalyticsClient } from "@/components/dashboard/analytics-client";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { getAnalyticsPageData } from "@/lib/data/dashboard";

export default async function AnalyticsPage() {
  const context = await getCurrentWorkspaceContextOrRedirect();
  const data = await getAnalyticsPageData({
    workspaceId: context.workspace.id,
    projectId: context.project?.id,
    userId: context.user.id,
    skipAuthorization: true,
  });

  return <AnalyticsClient {...data} />;
}
