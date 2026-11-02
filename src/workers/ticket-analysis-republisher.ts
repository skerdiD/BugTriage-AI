import * as Sentry from "@sentry/nextjs";

import "@/sentry.server.config";

import { closeBugAnalysisQueue } from "@/lib/queue/bug-analysis";
import { republishPendingTicketAnalyses } from "@/lib/queue/republish-ticket-analysis";
import { getRepublishInterval, runRepublisherLoop } from "@/lib/queue/republisher-loop";
import { prisma } from "@/lib/prisma";

const controller = new AbortController();
const stop = () => controller.abort();
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

function reportRunError(error: unknown) {
  Sentry.captureException(error, {
    tags: { area: "ticket-analysis-republisher", action: "run" },
  });
  console.error("[ticket-analysis-republisher] run failed");
}

async function main() {
  try {
    if (process.argv.includes("--watch")) {
      await runRepublisherLoop({
        run: () => republishPendingTicketAnalyses(),
        onError: reportRunError,
        signal: controller.signal,
        intervalMs: getRepublishInterval(),
      });
    } else {
      const result = await republishPendingTicketAnalyses();
      console.info("[ticket-analysis-republisher] run completed", result);
    }
    process.exitCode = 0;
  } catch (error) {
    reportRunError(error);
    process.exitCode = 1;
  } finally {
    const cleanupResults = await Promise.allSettled([
      closeBugAnalysisQueue(),
      prisma.$disconnect(),
    ]);

    for (const [index, result] of cleanupResults.entries()) {
      if (result.status === "fulfilled") continue;

      const resource = index === 0 ? "bullmq-producer" : "prisma";
      Sentry.captureException(result.reason, {
        tags: {
          area: "ticket-analysis-republisher",
          action: "cleanup",
          resource,
        },
      });
      console.error("[ticket-analysis-republisher] cleanup failed", { resource });
      process.exitCode = 1;
    }

    await Sentry.close(2_000);
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}

void main().catch((error) => {
  Sentry.captureException(error, {
    tags: { area: "ticket-analysis-republisher", action: "fatal" },
  });
  console.error("[ticket-analysis-republisher] fatal error");
  process.exitCode = 1;
});
