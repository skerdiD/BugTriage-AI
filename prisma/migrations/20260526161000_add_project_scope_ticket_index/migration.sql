-- Speed up project-scoped ticket lists and reporting queries ordered by recency.
CREATE INDEX "Ticket_workspaceId_projectId_createdAt_idx"
ON "public"."Ticket"("workspaceId" ASC, "projectId" ASC, "createdAt" ASC);
