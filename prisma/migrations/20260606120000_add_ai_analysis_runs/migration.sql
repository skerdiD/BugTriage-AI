CREATE TYPE "public"."AiAnalysisFeedback" AS ENUM ('HELPFUL', 'NOT_HELPFUL');

CREATE TABLE "public"."TicketAiAnalysisRun" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" "public"."TicketSeverity" NOT NULL,
    "category" TEXT,
    "priorityScore" INTEGER,
    "confidenceScore" INTEGER,
    "tags" JSONB,
    "likelyCause" TEXT,
    "suggestedFix" TEXT,
    "reproductionSteps" JSONB,
    "rawAiResponse" JSONB,
    "feedback" "public"."AiAnalysisFeedback",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAiAnalysisRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketAiAnalysisRun_ticketId_createdAt_idx"
ON "public"."TicketAiAnalysisRun"("ticketId" ASC, "createdAt" ASC);

CREATE INDEX "TicketAiAnalysisRun_feedback_idx"
ON "public"."TicketAiAnalysisRun"("feedback" ASC);

ALTER TABLE "public"."TicketAiAnalysisRun"
ADD CONSTRAINT "TicketAiAnalysisRun_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "public"."TicketAiAnalysisRun" (
    "id",
    "ticketId",
    "summary",
    "severity",
    "category",
    "priorityScore",
    "confidenceScore",
    "tags",
    "likelyCause",
    "suggestedFix",
    "reproductionSteps",
    "rawAiResponse",
    "createdAt"
)
SELECT
    gen_random_uuid()::text,
    analysis."ticketId",
    analysis."summary",
    ticket."severity",
    ticket."category",
    ticket."priorityScore",
    analysis."confidenceScore",
    analysis."tags",
    analysis."likelyCause",
    analysis."suggestedFix",
    analysis."reproductionSteps",
    analysis."rawAiResponse",
    analysis."createdAt"
FROM "public"."TicketAiAnalysis" analysis
INNER JOIN "public"."Ticket" ticket ON ticket."id" = analysis."ticketId";
