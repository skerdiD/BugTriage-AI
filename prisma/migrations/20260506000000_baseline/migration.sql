-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AttachmentType" AS ENUM ('SCREENSHOT', 'LOG', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TicketActivityType" AS ENUM ('CREATED', 'AI_ANALYZED', 'STATUS_CHANGED', 'ASSIGNED', 'COMMENTED', 'ATTACHMENT_ADDED', 'UPDATED');

-- CreateEnum
CREATE TYPE "public"."TicketSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('NEW', 'INVESTIGATING', 'IN_PROGRESS', 'FIXED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ticket" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reporterId" TEXT,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedBehavior" TEXT,
    "actualBehavior" TEXT,
    "stepsToReproduce" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "environment" TEXT,
    "affectedPage" TEXT,
    "severity" "public"."TicketSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'NEW',
    "category" TEXT,
    "priorityScore" INTEGER,
    "aiConfidence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketActivity" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "public"."TicketActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketAiAnalysis" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "likelyCause" TEXT,
    "suggestedFix" TEXT,
    "reproductionSteps" JSONB,
    "tags" JSONB,
    "confidenceScore" INTEGER,
    "rawAiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketAiAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT,
    "attachmentType" "public"."AttachmentType" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "public"."WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_workspaceId_idx" ON "public"."Project"("workspaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Project_workspaceId_slug_key" ON "public"."Project"("workspaceId" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_idx" ON "public"."Ticket"("assigneeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_code_key" ON "public"."Ticket"("code" ASC);

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "public"."Ticket"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Ticket_projectId_idx" ON "public"."Ticket"("projectId" ASC);

-- CreateIndex
CREATE INDEX "Ticket_reporterId_idx" ON "public"."Ticket"("reporterId" ASC);

-- CreateIndex
CREATE INDEX "Ticket_severity_idx" ON "public"."Ticket"("severity" ASC);

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "public"."Ticket"("status" ASC);

-- CreateIndex
CREATE INDEX "Ticket_workspaceId_category_idx" ON "public"."Ticket"("workspaceId" ASC, "category" ASC);

-- CreateIndex
CREATE INDEX "Ticket_workspaceId_idx" ON "public"."Ticket"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "Ticket_workspaceId_severity_createdAt_idx" ON "public"."Ticket"("workspaceId" ASC, "severity" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Ticket_workspaceId_status_createdAt_idx" ON "public"."Ticket"("workspaceId" ASC, "status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketActivity_actorId_idx" ON "public"."TicketActivity"("actorId" ASC);

-- CreateIndex
CREATE INDEX "TicketActivity_createdAt_idx" ON "public"."TicketActivity"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketActivity_ticketId_createdAt_idx" ON "public"."TicketActivity"("ticketId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketActivity_ticketId_idx" ON "public"."TicketActivity"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "TicketActivity_type_idx" ON "public"."TicketActivity"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TicketAiAnalysis_ticketId_key" ON "public"."TicketAiAnalysis"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "TicketAttachment_attachmentType_idx" ON "public"."TicketAttachment"("attachmentType" ASC);

-- CreateIndex
CREATE INDEX "TicketAttachment_ticketId_createdAt_idx" ON "public"."TicketAttachment"("ticketId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketAttachment_ticketId_idx" ON "public"."TicketAttachment"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "TicketComment_authorId_idx" ON "public"."TicketComment"("authorId" ASC);

-- CreateIndex
CREATE INDEX "TicketComment_createdAt_idx" ON "public"."TicketComment"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_createdAt_idx" ON "public"."TicketComment"("ticketId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "public"."TicketComment"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "public"."Workspace"("ownerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "public"."Workspace"("slug" ASC);

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "public"."WorkspaceMember"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "public"."WorkspaceMember"("userId" ASC, "workspaceId" ASC);

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "public"."WorkspaceMember"("workspaceId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketActivity" ADD CONSTRAINT "TicketActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketAiAnalysis" ADD CONSTRAINT "TicketAiAnalysis_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketComment" ADD CONSTRAINT "TicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
