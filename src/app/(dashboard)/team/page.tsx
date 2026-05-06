import {
  Crown,
  Mail,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const members = [
  {
    name: "Sarah Chen",
    role: "Engineering Lead",
    initials: "SC",
    status: "Owner",
    load: 74,
    tickets: 18,
  },
  {
    name: "Alex Rivera",
    role: "Frontend Engineer",
    initials: "AR",
    status: "Member",
    load: 82,
    tickets: 24,
  },
  {
    name: "Jordan Lee",
    role: "Backend Engineer",
    initials: "JL",
    status: "Member",
    load: 64,
    tickets: 17,
  },
  {
    name: "Taylor Morgan",
    role: "Product Engineer",
    initials: "TM",
    status: "Member",
    load: 51,
    tickets: 12,
  },
];

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Team"
        description="Manage engineering ownership, workload, and bug assignment visibility."
        badge="4 members"
      >
        <Button className="rounded-xl bg-violet-600 hover:bg-violet-500">
          <UserPlus className="mr-2 size-4" />
          Invite Member
        </Button>
      </PageHeader>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Users className="size-5 text-violet-300" />
            </div>
            <p className="mt-6 text-3xl font-bold">4</p>
            <p className="mt-1 text-sm text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <TicketCheck className="size-5 text-emerald-300" />
            </div>
            <p className="mt-6 text-3xl font-bold">71</p>
            <p className="mt-1 text-sm text-muted-foreground">Assigned Tickets</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Sparkles className="size-5 text-sky-300" />
            </div>
            <p className="mt-6 text-3xl font-bold">92%</p>
            <p className="mt-1 text-sm text-muted-foreground">AI Assignment Match</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {members.map((member) => (
          <Card
            key={member.name}
            className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 font-bold text-white shadow-lg shadow-violet-500/20">
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      {member.status === "Owner" && (
                        <Crown className="size-4 text-yellow-300" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>

                <Badge
                  className={
                    member.status === "Owner"
                      ? "border-yellow-500/25 bg-yellow-500/15 text-yellow-300"
                      : "border-violet-500/25 bg-violet-500/15 text-violet-300"
                  }
                >
                  {member.status}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-muted-foreground">Open Tickets</p>
                  <p className="mt-2 text-2xl font-bold">{member.tickets}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-muted-foreground">Workload</p>
                  <p className="mt-2 text-2xl font-bold">{member.load}%</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span>{member.load}%</span>
                </div>
                <Progress value={member.load} className="h-2 bg-white/10" />
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                >
                  <Mail className="mr-2 size-4" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                >
                  <ShieldCheck className="mr-2 size-4" />
                  Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}