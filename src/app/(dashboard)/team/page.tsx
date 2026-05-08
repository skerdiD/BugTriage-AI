import {
  Clock3,
  Crown,
  Mail,
  MailPlus,
  Sparkles,
  TicketCheck,
  Users,
} from "lucide-react";
import { WorkspaceRole } from "@prisma/client";

import { CopyInviteLinkButton } from "@/components/dashboard/copy-invite-link-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InviteMemberForm } from "@/components/dashboard/invite-member-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { RevokeInviteButton } from "@/components/dashboard/revoke-invite-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getInvitableWorkspaceRoles } from "@/lib/auth/authorization";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { listPendingWorkspaceInvites } from "@/lib/data/workspace-invites";
import { getWorkspaceMembers } from "@/lib/data/workspaces";
import { getAppBaseUrl } from "@/lib/security/app-url";

function roleBadgeClass(role: string) {
  if (role === "OWNER") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-300";
  }

  if (role === "ADMIN") {
    return "border-sky-500/25 bg-sky-500/15 text-sky-300";
  }

  return "border-violet-500/25 bg-violet-500/15 text-violet-300";
}

export default async function TeamPage() {
  const context = await getCurrentWorkspaceContextOrRedirect();
  const members = await getWorkspaceMembers(context.workspace.id, context.user.id);
  const invitableRoles = getInvitableWorkspaceRoles(context.role);
  const canManageInvites = invitableRoles.length > 0;
  const pendingInvites = canManageInvites
    ? await listPendingWorkspaceInvites(context.workspace.id, context.user.id)
    : [];
  const appBaseUrl = canManageInvites ? await getAppBaseUrl() : null;
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
        description="See who belongs to this workspace, which role they hold, and who is carrying bug ownership across the current team space."
        badge={`${members.length} members`}
      />

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Users className="size-5 text-violet-300" />
            </div>
            <p className="mt-6 text-3xl font-bold">{members.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Workspace Members</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <TicketCheck className="size-5 text-emerald-300" />
            </div>
            <p className="mt-6 text-3xl font-bold">{totalOpenAssignments}</p>
            <p className="mt-1 text-sm text-muted-foreground">Open Assigned Tickets</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Sparkles className="size-5 text-sky-300" />
            </div>
            <p className="mt-6 text-3xl font-bold">{totalReportedTickets}</p>
            <p className="mt-1 text-sm text-muted-foreground">Reported Tickets</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <MailPlus className="size-5 text-violet-300" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">Invite Teammates</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Create a secure shareable invite link for this workspace. The
                  invited person must sign in with the same email before the link
                  can add them to your team.
                </p>
              </div>
              <Badge className={roleBadgeClass(context.role)}>{context.role}</Badge>
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

            <div className="mt-6">
              {canManageInvites ? (
                <InviteMemberForm
                  workspaceId={context.workspace.id}
                  roleOptions={invitableRoles}
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
                  Invite controls stay with the workspace leadership team. Ask an owner
                  or admin if someone else needs access.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <Clock3 className="size-5 text-sky-300" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">Pending Invites</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pending access stays open for 7 days unless it is accepted or
                  revoked first.
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
                                {invite.role}
                              </Badge>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                              Invited by {invite.invitedByName} · Expires{" "}
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
                  No pending invites yet. Create one when you are ready to bring another
                  teammate into this workspace.
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

      {members.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {members.map((member) => (
            <Card
              key={member.id}
              className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 font-bold text-white shadow-lg shadow-violet-500/20">
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

                  <Badge className={roleBadgeClass(member.role)}>{member.role}</Badge>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4 text-sky-300" />
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-muted-foreground">Open Assigned</p>
                    <p className="mt-2 text-2xl font-bold">
                      {member.openAssignedTicketCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-muted-foreground">Reported</p>
                    <p className="mt-2 text-2xl font-bold">
                      {member.reportedTicketCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-muted-foreground">
                    <Mail className="size-4 text-sky-300" />
                    <span>{member.isOwner ? "Workspace owner" : `Role: ${member.role}`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No team members yet"
          description="This workspace does not have any members yet. Create an invite link when you are ready to add another teammate."
        />
      )}
    </div>
  );
}
