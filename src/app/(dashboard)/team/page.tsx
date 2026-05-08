import {
  Crown,
  Mail,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentWorkspaceContextOrRedirect } from "@/lib/auth/session";
import { getWorkspaceMembers } from "@/lib/data/workspaces";

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
      >
        <Button
          disabled
          className="rounded-xl bg-violet-600/80 text-white hover:bg-violet-600"
        >
          <UserPlus className="mr-2 size-4" />
          Invites Soon
        </Button>
      </PageHeader>

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
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                  >
                    <Mail className="mr-2 size-4" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                  >
                    <ShieldCheck className="mr-2 size-4" />
                    Role: {member.role}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No team members yet"
          description="This workspace does not have any members yet. Once invite flows are added, this page will show roles, ticket ownership, and collaboration health."
        />
      )}
    </div>
  );
}
