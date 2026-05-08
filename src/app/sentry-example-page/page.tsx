import Link from "next/link";
import { notFound } from "next/navigation";

import { TestErrorButton } from "@/components/sentry/test-error-button";

export const dynamic = "force-dynamic";

type SentryExamplePageProps = {
  searchParams?: Promise<{
    mode?: string;
  }>;
};

export default async function SentryExamplePage({
  searchParams,
}: SentryExamplePageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;

  if (resolvedSearchParams?.mode === "server") {
    throw new Error("Sentry test server render error");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-border/80 bg-card/80 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Development only
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Sentry verification page
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Use this page locally to verify that BugTriage AI reports both client
          and server-render errors to Sentry. This route returns a 404 in
          production.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <TestErrorButton />
          <Link
            href="/sentry-example-page?mode=server"
            prefetch={false}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/90 transition hover:bg-secondary"
          >
            Trigger server error
          </Link>
        </div>
      </section>
    </main>
  );
}
