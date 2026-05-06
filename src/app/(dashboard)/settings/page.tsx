import {
  Bell,
  Bot,
  Database,
  KeyRound,
  Lock,
  Save,
  Shield,
  Sparkles,
  UserCog,
  Webhook,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const settingsGroups = [
  {
    icon: Bot,
    title: "AI Triage Settings",
    description: "Control severity detection, confidence scoring, and generated ticket fields.",
    badge: "Gemini later",
  },
  {
    icon: Database,
    title: "Database & Storage",
    description: "Connect Prisma, Supabase database, file uploads, and workspace data later.",
    badge: "Not connected",
  },
  {
    icon: Webhook,
    title: "Notifications",
    description: "Send high-severity bug alerts to Slack, email, or webhook destinations.",
    badge: "Coming soon",
  },
  {
    icon: Shield,
    title: "Security Rules",
    description: "Configure workspace access, service role usage, and protected server actions.",
    badge: "Planned",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Configure your BugTriage AI workspace, integrations, and product behavior."
        badge="Workspace"
      >
        <Button className="rounded-xl bg-violet-600 hover:bg-violet-500">
          <Save className="mr-2 size-4" />
          Save Changes
        </Button>
      </PageHeader>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle>Workspace Profile</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                defaultValue="BugTriage AI"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Workspace Subtitle</label>
              <Input
                defaultValue="Engineering Command"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Default Project URL</label>
              <Input
                defaultValue="https://app.bugtriage.ai"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
              />
            </div>

            <Separator className="bg-white/10" />

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-violet-300" />
                <p className="font-semibold">Premium dark theme active</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The product currently uses a dark engineering dashboard style with
                violet/blue accents, subtle borders, and polished card surfaces.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          {settingsGroups.map((group) => (
            <Card
              key={group.title}
              className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20"
            >
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                    <group.icon className="size-5 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{group.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                </div>

                <Badge className="w-fit border-white/10 bg-white/[0.06] text-muted-foreground">
                  {group.badge}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <KeyRound className="size-5 text-violet-300" />
            <h3 className="mt-5 font-semibold">API Keys</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Store server-only keys safely after backend setup.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <Bell className="size-5 text-sky-300" />
            <h3 className="mt-5 font-semibold">Alert Rules</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Notify the team when critical bugs arrive.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <Lock className="size-5 text-emerald-300" />
            <h3 className="mt-5 font-semibold">Access Control</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add team roles and permissions after auth setup.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border-white/10 bg-white/[0.035] shadow-xl shadow-black/20">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <UserCog className="size-5 text-violet-300" />
            </div>
            <div>
              <h3 className="font-semibold">Developer mode</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Frontend-only mock mode is active. No database, auth, storage, or AI connected yet.
              </p>
            </div>
          </div>
          <Badge className="border-emerald-500/25 bg-emerald-500/15 text-emerald-300">
            Safe to build UI
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}