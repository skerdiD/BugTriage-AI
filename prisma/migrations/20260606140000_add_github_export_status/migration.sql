CREATE TYPE "public"."GitHubExportStatus" AS ENUM (
    'NOT_EXPORTED',
    'EXPORTING',
    'EXPORTED',
    'FAILED'
);

ALTER TABLE "public"."Ticket"
ADD COLUMN "githubExportStatus" "public"."GitHubExportStatus" NOT NULL DEFAULT 'NOT_EXPORTED',
ADD COLUMN "githubIssueUrl" TEXT,
ADD COLUMN "githubIssueNumber" INTEGER,
ADD COLUMN "githubExportedAt" TIMESTAMP(3),
ADD COLUMN "githubExportError" TEXT;

CREATE INDEX "Ticket_githubExportStatus_idx"
ON "public"."Ticket"("githubExportStatus" ASC);
