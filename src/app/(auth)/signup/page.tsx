"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
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
import { getAuthPageHref, getSafeRedirectPath } from "@/lib/security/urls";
import { captureClientException } from "@/lib/observability/client-monitoring";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectedFrom = getSafeRedirectPath(searchParams.get("redirectedFrom"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createBrowserSupabaseClient();

      const origin = window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectedFrom)}`,
          data: {
            full_name: name,
            name,
          },
        },
      });

      if (error) {
        captureClientException(error, {
          tags: {
            area: "auth",
            action: "signup",
          },
        });
        setErrorMessage(getSafeAuthClientErrorMessage(error, "signup"));
        return;
      }

      if (data.session) {
        router.push(redirectedFrom);
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created. Check your email to confirm your account before signing in."
      );
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "auth",
          action: "signup",
        },
      });
      setErrorMessage(getSafeAuthClientErrorMessage(error, "signup"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_34rem)]" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
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
              Set up your workspace
            </Badge>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white">
              Make the handoff easier from day one.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Give support, QA, and engineering one place for the original report,
              supporting evidence, ticket owner, and next decision.
            </p>

            <div className="mt-8 grid max-w-2xl gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <ShieldCheck className="size-5 text-emerald-300" />
                <p className="mt-4 font-semibold">Clear boundaries</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Each workspace keeps its own members, projects, and tickets.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <LockKeyhole className="size-5 text-violet-300" />
                <p className="mt-4 font-semibold">Files stay with the report</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Screenshots and logs are stored privately for workspace members.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <Sparkles className="size-5 text-sky-300" />
                <p className="mt-4 font-semibold">A useful first pass</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Suggested fields are easy to scan, question, and correct.
                </p>
              </div>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md rounded-3xl border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <CardHeader className="space-y-3">
              <AppLogoMark className="size-12 lg:hidden" iconClassName="size-8" />

              <div>
                <CardTitle className="text-2xl">Create account</CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Add your profile now. You&apos;ll name the workspace next.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Sarah Chen"
                    className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                    required
                  />
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
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a secure password"
                    minLength={6}
                    className="h-11 rounded-xl border-white/10 bg-white/[0.04]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use at least 6 characters. If email confirmation is enabled,
                    we&apos;ll email you a confirmation link.
                  </p>
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

                {successMessage ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    <p>{successMessage}</p>
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already part of a workspace?{" "}
                  <Link
                    href={getAuthPageHref("/login", redirectedFrom)}
                    className="font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Sign in
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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
