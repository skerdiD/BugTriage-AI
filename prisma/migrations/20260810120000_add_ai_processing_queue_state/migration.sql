CREATE TYPE "AiProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "Ticket"
ADD COLUMN "aiProcessingStatus" "AiProcessingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "aiProcessingJobId" TEXT,
ADD COLUMN "aiProcessingError" TEXT,
ADD COLUMN "aiProcessingStartedAt" TIMESTAMP(3),
ADD COLUMN "aiProcessingCompletedAt" TIMESTAMP(3),
ADD COLUMN "aiProcessingRequestedById" TEXT,
ADD COLUMN "aiInputContext" JSONB;

UPDATE "Ticket" AS ticket
SET
  "aiProcessingStatus" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM "TicketAiAnalysis" AS analysis
      WHERE analysis."ticketId" = ticket."id"
    ) THEN 'COMPLETED'::"AiProcessingStatus"
    ELSE 'FAILED'::"AiProcessingStatus"
  END,
  "aiProcessingCompletedAt" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM "TicketAiAnalysis" AS analysis
      WHERE analysis."ticketId" = ticket."id"
    ) THEN ticket."updatedAt"
    ELSE NULL
  END;

ALTER TABLE "TicketAiAnalysisRun"
ADD COLUMN "processingJobId" TEXT;

CREATE UNIQUE INDEX "Ticket_aiProcessingJobId_key" ON "Ticket"("aiProcessingJobId");
CREATE INDEX "Ticket_aiProcessingStatus_idx" ON "Ticket"("aiProcessingStatus");
CREATE INDEX "Ticket_aiProcessingRequestedById_idx" ON "Ticket"("aiProcessingRequestedById");
CREATE UNIQUE INDEX "TicketAiAnalysisRun_processingJobId_key" ON "TicketAiAnalysisRun"("processingJobId");

ALTER TABLE "Ticket"
ADD CONSTRAINT "Ticket_aiProcessingRequestedById_fkey"
FOREIGN KEY ("aiProcessingRequestedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
