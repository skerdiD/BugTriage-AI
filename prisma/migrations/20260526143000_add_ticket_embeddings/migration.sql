-- Enable pgvector for semantic similar-issue search.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "public"."TicketEmbedding" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketEmbedding_ticketId_key" ON "public"."TicketEmbedding"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "TicketEmbedding_workspaceId_idx" ON "public"."TicketEmbedding"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "TicketEmbedding_projectId_idx" ON "public"."TicketEmbedding"("projectId" ASC);

-- CreateIndex
CREATE INDEX "TicketEmbedding_workspaceId_projectId_idx" ON "public"."TicketEmbedding"("workspaceId" ASC, "projectId" ASC);

-- CreateIndex
CREATE INDEX "TicketEmbedding_contentHash_idx" ON "public"."TicketEmbedding"("contentHash" ASC);

-- CreateIndex
CREATE INDEX "TicketEmbedding_embedding_hnsw_idx" ON "public"."TicketEmbedding" USING hnsw ("embedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "public"."TicketEmbedding" ADD CONSTRAINT "TicketEmbedding_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
