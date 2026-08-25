"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeAuthClientErrorMessage } from "@/lib/security/public-errors";
import { getSafeRedirectPath } from "@/lib/security/urls";
import { captureClientException } from "@/lib/observability/client-monitoring";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/lib/demo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectedFrom = getSafeRedirectPath(searchParams.get("redirectedFrom"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        captureClientException(error, {
          tags: {
            area: "auth",
            action: "login",
          },
        });
        setErrorMessage(getSafeAuthClientErrorMessage(error, "login"));
        return;
      }

      router.push(redirectedFrom);
      router.refresh();
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "auth",
          action: "login",
        },
      });
      setErrorMessage(getSafeAuthClientErrorMessage(error, "login"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoLogin() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD,
      });

      if (error) {
        captureClientException(error, {
          tags: {
            area: "auth",
            action: "demo-login",
          },
        });
        setErrorMessage(getSafeAuthClientErrorMessage(error, "login"));
        return;
      }

      router.push(redirectedFrom);
      router.refresh();
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "auth",
          action: "demo-login",
        },
      });
      setErrorMessage(getSafeAuthClientErrorMessage(error, "login"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <section className="grid w-full gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-center">
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
              A calmer bug queue
            </Badge>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white">
              Pick up where the team left off.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              The evidence, decisions, and next move are still here—without asking
              support or QA to explain the same issue again.
            </p>

            <div className="mt-8 grid max-w-2xl gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <ShieldCheck className="size-5 text-emerald-300" />
                <p className="mt-4 font-semibold">Workspace access</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Only signed-in members can open your team&apos;s queue.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <LockKeyhole className="size-5 text-violet-300" />
                <p className="mt-4 font-semibold">Evidence stays private</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Screenshots and logs stay attached to the workspace.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <Sparkles className="size-5 text-sky-300" />
                <p className="mt-4 font-semibold">Drafts, not verdicts</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The first pass is there to review, correct, and hand off.
                </p>
              </div>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md rounded-3xl border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <CardHeader className="space-y-3">
              <AppLogoMark className="size-12 lg:hidden" iconClassName="size-8" />

              <div>
                <CardTitle className="text-2xl">Welcome back</CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Use your account, or open the sample queue and look around first.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] p-4">
                  <p className="text-sm font-semibold text-white">Want to poke around first?</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Open a realistic, read-only queue. No signup and no blank dashboard.
                  </p>
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={handleDemoLogin}
                    className="mt-3 h-11 w-full rounded-xl bg-violet-600 font-semibold shadow-lg shadow-violet-500/20 hover:bg-violet-500"
                  >
                    Open sample queue
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="h-px flex-1 bg-white/10" />
                  Or sign in
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                    required
                  />
                </div>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Starting a new team queue?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Set up an account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
