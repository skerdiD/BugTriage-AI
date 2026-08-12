-- Preserve workspace/project metadata on embeddings for efficient filtered vector
-- searches, while making Ticket the database-authoritative ownership record.
--
-- The validation below intentionally aborts if historical corruption exists. It
-- never guesses which workspace/project should own an embedding.
LOCK TABLE "Ticket" IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE "TicketEmbedding" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "TicketEmbedding" AS embedding
    INNER JOIN "Ticket" AS ticket ON ticket."id" = embedding."ticketId"
    WHERE embedding."workspaceId" <> ticket."workspaceId"
       OR embedding."projectId" <> ticket."projectId"
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce TicketEmbedding tenant integrity: embedding rows whose ownership disagrees with Ticket exist. Resolve them deliberately before retrying this migration.';
  END IF;
END $$;

-- PostgreSQL requires a unique referenced key for a composite foreign key.
CREATE UNIQUE INDEX "Ticket_id_workspaceId_projectId_key"
ON "Ticket"("id", "workspaceId", "projectId");

-- Prisma requires the complete local relation key to be declared unique for a
-- one-to-one relation, even though the existing unique ticketId index already
-- makes this combination unique in PostgreSQL.
CREATE UNIQUE INDEX "TicketEmbedding_ticketId_workspaceId_projectId_key"
ON "TicketEmbedding"("ticketId", "workspaceId", "projectId");

ALTER TABLE "TicketEmbedding"
DROP CONSTRAINT "TicketEmbedding_ticketId_fkey",
ADD CONSTRAINT "TicketEmbedding_ticketId_workspaceId_projectId_fkey"
FOREIGN KEY ("ticketId", "workspaceId", "projectId")
REFERENCES "Ticket"("id", "workspaceId", "projectId")
ON DELETE CASCADE
ON UPDATE CASCADE;
