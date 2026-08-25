import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  LogIn,
  ShieldAlert,
  Users,
} from "lucide-react";

import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { AcceptWorkspaceInviteButton } from "@/components/dashboard/accept-workspace-invite-button";
import { InviteSignOutButton } from "@/components/dashboard/invite-sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getInviteLifecycleStatus,
  getWorkspaceInviteByToken,
  normalizeInviteEmail,
} from "@/lib/data/workspace-invites";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatWorkspaceRole } from "@/lib/utils";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

function roleBadgeClass(role: string) {
  if (role === "OWNER") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-300";
  }

  if (role === "ADMIN") {
    return "border-sky-500/25 bg-sky-500/15 text-sky-300";
  }

  return "border-violet-500/25 bg-violet-500/15 text-violet-300";
}

function InviteStateCard(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="w-full rounded-3xl border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
      <CardHeader className="space-y-4">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          {props.icon}
        </div>
        <div>
          <CardTitle className="text-2xl">{props.title}</CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {props.description}
          </p>
        </div>
      </CardHeader>
      {props.actions ? <CardContent>{props.actions}</CardContent> : null}
    </Card>
  );
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getWorkspaceInviteByToken(token);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const invitePath = `/invite/${token}`;
  const normalizedUserEmail = normalizeInviteEmail(user?.email ?? "");
  const inviteEmailMatches =
    invite && normalizedUserEmail
      ? normalizeInviteEmail(invite.email) === normalizedUserEmail
      : false;

  if (!invite) {
    return (
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <InviteStateCard
            icon={<ShieldAlert className="size-5 text-red-300" />}
            title="This invite is no longer available"
            description="The link may be incomplete, expired, or already removed. Ask a workspace owner or admin for a new one."
            actions={
              <Button
                asChild
                className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500"
              >
                <Link href="/login">Back to sign in</Link>
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  const lifecycleStatus = getInviteLifecycleStatus(invite);

  if (lifecycleStatus === "REVOKED") {
    return (
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <InviteStateCard
            icon={<ShieldAlert className="size-5 text-red-300" />}
            title="This invite was revoked"
            description="It can no longer add anyone to the workspace. Ask an owner or admin for a new link if you still need access."
          />
        </div>
      </main>
    );
  }

  if (lifecycleStatus === "EXPIRED") {
    return (
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <InviteStateCard
            icon={<AlertTriangle className="size-5 text-amber-300" />}
            title="This invite expired"
            description="Invite links stay open for 7 days. Ask an owner or admin to create a fresh one."
          />
        </div>
      </main>
    );
  }

  if (lifecycleStatus === "ACCEPTED") {
    return (
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <InviteStateCard
            icon={<CheckCircle2 className="size-5 text-emerald-300" />}
            title="This invite has already been used"
            description="If you joined with it, open the dashboard and select the workspace from the switcher at the top."
            actions={
              <Button
                asChild
                className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500"
              >
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <section className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="hidden lg:block">
              <Link href="/" className="mb-10 flex items-center gap-3">
                <AppLogoMark className="size-12" iconClassName="size-8" />
                <div>
                  <p className="text-2xl font-bold tracking-tight">BugTriage AI</p>
                  <p className="text-sm text-muted-foreground">
                    From report to fix
                  </p>
                </div>
              </Link>

              <Badge className="mb-5 rounded-full border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-violet-200">
                Workspace invite
              </Badge>

              <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white">
                Sign in before you join this workspace.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Invite links stay private and only work for the email address they
                were issued to. Once you sign in, you can review the workspace and
                accept access securely.
              </p>
            </div>

            <InviteStateCard
              icon={<LogIn className="size-5 text-violet-300" />}
              title="Sign in to review the invite"
              description="Use the email address this link was sent to. Once you are signed in, you can check the workspace and role before joining."
              actions={
                <div className="space-y-3">
                  <Button
                    asChild
                    className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500"
                  >
                    <Link
                      href={`/login?redirectedFrom=${encodeURIComponent(invitePath)}`}
                    >
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                  >
                    <Link
                      href={`/signup?redirectedFrom=${encodeURIComponent(invitePath)}`}
                    >
                      Create an account first
                    </Link>
                  </Button>
                </div>
              }
            />
          </section>
        </div>
      </main>
    );
  }

  if (!inviteEmailMatches) {
    return (
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <InviteStateCard
            icon={<ShieldAlert className="size-5 text-amber-300" />}
            title="This link belongs to another email"
            description={`The invite is for ${invite.email}, but you are signed in as ${user.email ?? "another account"}. Sign out and use the invited address to continue.`}
            actions={
              <div className="flex flex-col gap-3 sm:flex-row">
                <InviteSignOutButton redirectedFrom={invitePath} />
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                >
                  <Link href="/dashboard">Keep this account</Link>
                </Button>
              </div>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <section className="grid w-full gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="hidden lg:block">
            <Link href="/" className="mb-10 flex items-center gap-3">
              <AppLogoMark className="size-12" iconClassName="size-8" />
              <div>
                <p className="text-2xl font-bold tracking-tight">BugTriage AI</p>
                <p className="text-sm text-muted-foreground">From report to fix</p>
              </div>
            </Link>

            <Badge className="mb-5 rounded-full border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-violet-200">
              Review before joining
            </Badge>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white">
              You&apos;ve been invited to {invite.workspaceName}.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Accepting adds this workspace to your account. You can switch back to
              your other workspaces at any time.
            </p>
          </div>

          <Card className="w-full rounded-3xl border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <CardHeader className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Users className="size-5 text-violet-300" />
              </div>
              <div>
                <CardTitle className="text-2xl">Workspace invite</CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Check the email and role below before adding this team to your
                  account.
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Workspace
                </p>
                <p className="mt-2 text-xl font-semibold">{invite.workspaceName}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invited email: {invite.email}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Role
                  </p>
                  <div className="mt-3">
                    <Badge className={roleBadgeClass(invite.role)}>
                      {formatWorkspaceRole(invite.role)}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Expires
                  </p>
                  <p className="mt-3 font-medium">
                    {invite.expiresAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <AcceptWorkspaceInviteButton token={token} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
