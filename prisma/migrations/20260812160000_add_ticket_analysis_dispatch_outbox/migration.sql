CREATE TYPE "TicketAnalysisDispatchStatus" AS ENUM ('PENDING', 'DISPATCHING', 'DISPATCHED', 'FAILED');

CREATE TABLE "TicketAnalysisDispatch" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "TicketAnalysisDispatchStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "claimToken" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TicketAnalysisDispatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketAnalysisDispatch_jobId_key" ON "TicketAnalysisDispatch"("jobId");
CREATE INDEX "TicketAnalysisDispatch_status_nextAttemptAt_idx" ON "TicketAnalysisDispatch"("status", "nextAttemptAt");
CREATE INDEX "TicketAnalysisDispatch_ticketId_createdAt_idx" ON "TicketAnalysisDispatch"("ticketId", "createdAt");

ALTER TABLE "TicketAnalysisDispatch"
ADD CONSTRAINT "TicketAnalysisDispatch_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Ticket"
SET "aiProcessingJobId" = 'ticket-analysis-' || "id"
WHERE "aiProcessingStatus" IN ('PENDING', 'PROCESSING')
  AND "aiProcessingJobId" IS NULL;

INSERT INTO "TicketAnalysisDispatch" ("id", "ticketId", "jobId", "status", "nextAttemptAt", "createdAt", "updatedAt")
SELECT 'legacy-dispatch-' || "id", "id", "aiProcessingJobId", 'PENDING'::"TicketAnalysisDispatchStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Ticket"
WHERE "aiProcessingStatus" IN ('PENDING', 'PROCESSING')
  AND "aiProcessingJobId" IS NOT NULL;
