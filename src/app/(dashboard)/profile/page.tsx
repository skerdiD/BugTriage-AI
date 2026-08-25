import { Mail, ShieldCheck, UserRound, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileNameForm } from "@/components/dashboard/profile-name-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentDashboardUser,
  getCurrentWorkspaceContextOrRedirect,
} from "@/lib/auth/session";
import { formatWorkspaceRole } from "@/lib/utils";

export default async function ProfilePage() {
  const [user, context] = await Promise.all([
    getCurrentDashboardUser(),
    getCurrentWorkspaceContextOrRedirect(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Update how your name appears to teammates and check your current access."
        badge="Signed-in account"
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar
                size="lg"
                className="bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20"
              >
                <AvatarFallback className="bg-transparent font-bold text-white">
                  {user.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-xl font-semibold text-white">
                  {user.name}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  This is how you appear on reports, notes, and activity.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge className="border-emerald-500/25 bg-emerald-500/15 text-emerald-200">
                Active account
              </Badge>
              <Badge className="border-violet-500/25 bg-violet-500/10 text-violet-200">
                {formatWorkspaceRole(context.role)}
              </Badge>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <ProfileNameForm currentName={user.name} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Access details</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <UserRound className="size-5 text-violet-300" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Name
              </p>
              <p className="mt-2 truncate font-semibold text-white">{user.name}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Mail className="size-5 text-sky-300" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </p>
              <p className="mt-2 truncate font-semibold text-white">
                {user.email}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Users className="size-5 text-fuchsia-300" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Current workspace
              </p>
              <p className="mt-2 truncate font-semibold text-white">
                {context.workspace.name}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {context.workspace.slug}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <ShieldCheck className="size-5 text-emerald-300" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Workspace role
              </p>
              <p className="mt-2 truncate font-semibold text-white">
                {formatWorkspaceRole(context.role)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {context.workspace.memberCount} members
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
