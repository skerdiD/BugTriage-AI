import {
  Clock3,
  ClipboardList,
  Crown,
  Mail,
  MailPlus,
  TicketCheck,
  Users,
} from "lucide-react";
import { WorkspaceRole } from "@prisma/client";

import { CopyInviteLinkButton } from "@/components/dashboard/copy-invite-link-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InviteMemberForm } from "@/components/dashboard/invite-member-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { RevokeInviteButton } from "@/components/dashboard/revoke-invite-button";
import { WorkspaceMemberControls } from "@/components/dashboard/workspace-member-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  canManageWorkspaceMemberRole,
  getInvitableWorkspaceRoles,
} from "@/lib/auth/authorization";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { listPendingWorkspaceInvites } from "@/lib/data/workspace-invites";
import { getWorkspaceMembers } from "@/lib/data/workspaces";
import { getAppBaseUrl } from "@/lib/security/app-url";
import { formatWorkspaceRole } from "@/lib/utils";

function formatMemberCount(count: number) {
  return `${count} ${count === 1 ? "member" : "members"}`;
}

function roleBadgeClass(role: string) {
  if (role === "OWNER") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-300";
  }

  if (role === "ADMIN") {
    return "border-sky-500/25 bg-sky-500/15 text-sky-300";
  }

  return "border-violet-500/25 bg-violet-500/15 text-violet-300";
}

function getAssignableRoleOptions(
  actorRole: WorkspaceRole,
  memberRole: WorkspaceRole,
  isOwner: boolean
) {
  if (isOwner || !canManageWorkspaceMemberRole(actorRole, memberRole)) {
    return [] as WorkspaceRole[];
  }

  if (actorRole === WorkspaceRole.OWNER) {
    return [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER];
  }

  if (actorRole === WorkspaceRole.ADMIN && memberRole === WorkspaceRole.MEMBER) {
    return [WorkspaceRole.MEMBER];
  }

  return [] as WorkspaceRole[];
}

export default async function TeamPage() {
  const context = await getCurrentWorkspaceContextOrRedirect();
  const invitableRoles = getInvitableWorkspaceRoles(context.role);
  const canManageInvites = invitableRoles.length > 0;
  const [members, pendingInvites, appBaseUrl] = await Promise.all([
    getWorkspaceMembers(context.workspace.id, context.user.id),
    canManageInvites
      ? listPendingWorkspaceInvites(context.workspace.id, context.user.id)
      : Promise.resolve([]),
    canManageInvites ? getAppBaseUrl() : Promise.resolve(""),
  ]);
  const totalOpenAssignments = members.reduce(
    (sum, member) => sum + member.openAssignedTicketCount,
    0
  );
  const totalReportedTickets = members.reduce(
    (sum, member) => sum + member.reportedTicketCount,
    0
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team"
        description="Manage workspace members, roles, invites, and ticket ownership."
        badge={formatMemberCount(members.length)}
      />

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
          <CardContent className="flex items-center gap-4 p-5 sm:p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Users className="size-5 text-violet-300" />
            </div>
            <div>
              <p className="text-3xl font-bold">{members.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Workspace members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
          <CardContent className="flex items-center gap-4 p-5 sm:p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <TicketCheck className="size-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalOpenAssignments}</p>
              <p className="mt-1 text-sm text-muted-foreground">Open assignments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
          <CardContent className="flex items-center gap-4 p-5 sm:p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <ClipboardList className="size-5 text-sky-300" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalReportedTickets}</p>
              <p className="mt-1 text-sm text-muted-foreground">Reports submitted</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <MailPlus className="size-5 text-violet-300" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">Invite teammates</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Create an invite link for one email address and workspace role. The
                  recipient must sign in with that address before joining.
                </p>
              </div>
              <Badge className={roleBadgeClass(context.role)}>
                {formatWorkspaceRole(context.role)}
              </Badge>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
              {context.role === WorkspaceRole.OWNER ? (
                <p>
                  Owners can invite <span className="font-semibold text-white">admins</span>{" "}
                  and <span className="font-semibold text-white">members</span>.
                </p>
              ) : context.role === WorkspaceRole.ADMIN ? (
                <p>
                  Admins can invite <span className="font-semibold text-white">members</span>.
                </p>
              ) : (
                <p>
                  Members can review the team roster, but only owners and admins can
                  create invite links.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-muted-foreground">
              Invite email delivery is not connected yet. Copy the generated link
              into Slack, email, or your team chat.
            </div>

            <div className="mt-6">
              {canManageInvites ? (
                <InviteMemberForm
                  workspaceId={context.workspace.id}
                  roleOptions={invitableRoles}
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
                  Ask a workspace owner or admin to create the invite.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <Clock3 className="size-5 text-sky-300" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">Pending invites</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Links expire after 7 days or when they are accepted or revoked.
                </p>
              </div>
              <Badge className="border-white/10 bg-white/[0.04] text-white/80">
                {canManageInvites ? pendingInvites.length : 0}
              </Badge>
            </div>

            {canManageInvites ? (
              pendingInvites.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {pendingInvites.map((invite) => {
                    const inviteLink = `${appBaseUrl}/invite/${invite.token}`;

                    return (
                      <div
                        key={invite.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{invite.email}</p>
                              <Badge className={roleBadgeClass(invite.role)}>
                                {formatWorkspaceRole(invite.role)}
                              </Badge>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                              Invited by {invite.invitedByName} · expires{" "}
                              {invite.expiresAt.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <p className="break-all font-mono text-xs text-white/90">
                                {inviteLink}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-3">
                            <CopyInviteLinkButton inviteLink={inviteLink} />
                            <RevokeInviteButton
                              workspaceId={context.workspace.id}
                              inviteId={invite.id}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
                  No pending invites. Create one when a teammate needs access.
                </div>
              )
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
                Pending invite links are only visible to workspace owners and admins.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Workspace members
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current access, ownership, and assignment load.
          </p>
        </div>
        <Badge className="w-fit border-white/10 bg-white/[0.05] text-slate-200">
          {formatMemberCount(members.length)}
        </Badge>
      </div>

      {members.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {members.map((member) => {
            const availableRoles = getAssignableRoleOptions(
              context.role,
              member.role,
              member.isOwner
            );
            const canRemoveMember =
              !member.isOwner &&
              canManageWorkspaceMemberRole(context.role, member.role);

            return (
              <Card
                key={member.id}
                className="rounded-3xl border-white/10 bg-white/[0.035] py-0 shadow-xl shadow-black/20"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20 sm:size-14">
                        {member.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          {member.isOwner ? (
                            <Crown className="size-4 text-yellow-300" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Joined{" "}
                          {member.joinedAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <Badge className={roleBadgeClass(member.role)}>
                      {formatWorkspaceRole(member.role)}
                    </Badge>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4 text-sky-300" />
                      <span className="min-w-0 break-all">{member.email}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                      <p className="text-xs text-muted-foreground">Open assignments</p>
                      <p className="mt-2 text-2xl font-bold">
                        {member.openAssignedTicketCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                      <p className="text-xs text-muted-foreground">Reports submitted</p>
                      <p className="mt-2 text-2xl font-bold">
                        {member.reportedTicketCount}
                      </p>
                    </div>
                  </div>

                  {availableRoles.length > 0 || canRemoveMember ? (
                    <div className="mt-5">
                      <WorkspaceMemberControls
                        workspaceId={context.workspace.id}
                        memberId={member.id}
                        memberName={member.name}
                        currentRole={member.role}
                        availableRoles={availableRoles}
                        canRemove={canRemoveMember}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="No other team members yet"
          description="Create an invite link when a teammate needs access to this workspace."
        />
      )}
    </div>
  );
}
