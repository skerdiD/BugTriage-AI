import * as Sentry from "@sentry/nextjs";

import { republishPendingTicketAnalyses } from "@/lib/queue/republish-ticket-analysis";
import { prisma } from "@/lib/prisma";

await import("@/sentry.server.config");

try {
  const result = await republishPendingTicketAnalyses();
  console.info("[ticket-analysis-republisher] run completed", result);
  process.exitCode = 0;
} catch (error) {
  Sentry.captureException(error, {
    tags: { area: "ticket-analysis-republisher", action: "run" },
  });
  console.error("[ticket-analysis-republisher] run failed");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await Sentry.close(2_000);
}
