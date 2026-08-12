-- Prevent concurrent Ticket/Project writes while validating the new tenant invariant.
LOCK TABLE "Project" IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE "Ticket" IN SHARE ROW EXCLUSIVE MODE;

-- Reject existing cross-workspace tickets rather than guessing which tenant owns them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Ticket" AS ticket
    INNER JOIN "Project" AS project ON project."id" = ticket."projectId"
    WHERE ticket."workspaceId" <> project."workspaceId"
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce Ticket project/workspace tenant integrity: cross-workspace Ticket rows exist. Resolve them deliberately before retrying this migration.';
  END IF;
END $$;

-- PostgreSQL requires a unique referenced key for the composite foreign key.
CREATE UNIQUE INDEX "Project_id_workspaceId_key"
ON "Project"("id", "workspaceId");

ALTER TABLE "Ticket"
DROP CONSTRAINT "Ticket_projectId_fkey",
ADD CONSTRAINT "Ticket_projectId_workspaceId_fkey"
FOREIGN KEY ("projectId", "workspaceId") REFERENCES "Project"("id", "workspaceId")
ON DELETE CASCADE ON UPDATE CASCADE;
