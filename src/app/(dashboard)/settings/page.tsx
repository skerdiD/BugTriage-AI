import {
  FolderKanban,
  Shield,
  Users,
} from "lucide-react";
import { WorkspaceRole } from "@prisma/client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectCreateForm } from "@/components/dashboard/project-create-form";
import { WorkspaceCreateForm } from "@/components/dashboard/workspace-create-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRequiredWorkspaceRole } from "@/lib/auth/authorization";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { formatWorkspaceRole } from "@/lib/utils";

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export default async function SettingsPage() {
  const context = await getCurrentWorkspaceContextOrRedirect();
  const canManageProjects = hasRequiredWorkspaceRole(
    context.role,
    WorkspaceRole.ADMIN
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspace settings"
        description="Review workspace access, projects, and report routing."
        badge={context.workspace.slug}
      />

      <section className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold">{context.workspace.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Slug: <span className="font-mono">{context.workspace.slug}</span>
                  </p>
                </div>
                <Badge className="border-violet-500/25 bg-violet-500/10 text-violet-200">
                  {formatWorkspaceRole(context.role)}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Workspace owner
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {context.workspace.ownerName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {context.workspace.ownerEmail}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Workspace summary
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {formatCount(context.workspace.memberCount, "member")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCount(context.workspace.projectCount, "project")} {"\u00B7"}{" "}
                    {formatCount(context.workspace.ticketCount, "ticket")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border-white/10 bg-white/[0.03] py-0 shadow-none">
                <CardContent className="p-4">
                  <Users className="size-5 text-violet-300" />
                  <p className="mt-4 text-2xl font-bold">
                    {context.workspace.memberCount}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Members</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-white/10 bg-white/[0.03] py-0 shadow-none">
                <CardContent className="p-4">
                  <FolderKanban className="size-5 text-sky-300" />
                  <p className="mt-4 text-2xl font-bold">
                    {context.availableProjects.length}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Projects</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-white/10 bg-white/[0.03] py-0 shadow-none">
                <CardContent className="p-4">
                  <Shield className="size-5 text-emerald-300" />
                  <p className="mt-4 text-2xl font-bold">
                    {formatWorkspaceRole(context.role)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Your role</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
            <CardHeader>
            <CardTitle>Where reports go</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {context.availableProjects.length > 0 ? (
                <div className="space-y-3">
                  {context.availableProjects.map((project) => {
                    const isActiveProject = context.project?.id === project.id;

                    return (
                      <div
                        key={project.id}
                        className={
                          isActiveProject
                            ? "rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.045] p-4"
                            : "rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{project.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {project.description ?? "No routing note has been added."}
                            </p>
                          </div>
                          {isActiveProject ? (
                            <Badge className="border-emerald-500/25 bg-emerald-500/15 text-emerald-200">
                              Selected
                            </Badge>
                          ) : (
                            <Badge className="border-white/10 bg-white/[0.05] text-muted-foreground">
                              Available
                            </Badge>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{project.ticketCount} tickets</span>
                          <span className="font-mono">{project.slug}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No projects yet"
                  description="Create the first project and describe which product area it covers."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
            <CardHeader>
            <CardTitle>Add a project</CardTitle>
            </CardHeader>

            <CardContent>
              <ProjectCreateForm
                workspaceId={context.workspace.id}
                canManageProjects={canManageProjects}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Workspaces you can access</CardTitle>
          </CardHeader>

          <CardContent>
            {context.availableWorkspaces.length > 0 ? (
              <div className="space-y-3">
                {context.availableWorkspaces.map((workspace) => {
                  const isActiveWorkspace = workspace.id === context.workspace.id;

                  return (
                    <div
                      key={workspace.id}
                        className={
                          isActiveWorkspace
                            ? "rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.045] p-4"
                            : "rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{workspace.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Owned by {workspace.ownerName}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="border-white/10 bg-white/[0.05] text-white/80">
                            {formatWorkspaceRole(workspace.role)}
                          </Badge>
                          <Badge
                            className={
                              isActiveWorkspace
                                ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-200"
                                : "border-white/10 bg-white/[0.05] text-muted-foreground"
                            }
                          >
                            {isActiveWorkspace ? "Active" : "Available"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{formatCount(workspace.memberCount, "member")}</span>
                        <span>{formatCount(workspace.projectCount, "project")}</span>
                        <span>{formatCount(workspace.ticketCount, "ticket")}</span>
                        <span className="font-mono">{workspace.slug}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No workspaces yet"
                description="Create one to give a team its own members, projects, and tickets."
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Add another workspace</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Use a separate workspace when the people or access boundaries change.
              We&apos;ll create a default intake project with it.
            </p>
            <WorkspaceCreateForm />
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
