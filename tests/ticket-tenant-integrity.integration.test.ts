import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.includes("_test")) {
  throw new Error(
    "Database integrity tests require DATABASE_URL to point to a dedicated test database."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const suffix = randomUUID().replaceAll("-", "");
const ownerId = `tenant-integrity-owner-${suffix}`;
const workspaceAId = `tenant-integrity-workspace-a-${suffix}`;
const workspaceBId = `tenant-integrity-workspace-b-${suffix}`;
const projectAId = `tenant-integrity-project-a-${suffix}`;
const projectBId = `tenant-integrity-project-b-${suffix}`;
const embeddingVector = `[${Array.from({ length: 768 }, () => "0").join(",")}]`;

describe("Ticket project/workspace tenant integrity", () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `tenant-integrity-${suffix}@example.test`,
        name: "Tenant integrity test owner",
      },
    });

    await prisma.workspace.createMany({
      data: [
        {
          id: workspaceAId,
          name: "Tenant integrity workspace A",
          slug: `tenant-integrity-a-${suffix}`,
          ownerId,
        },
        {
          id: workspaceBId,
          name: "Tenant integrity workspace B",
          slug: `tenant-integrity-b-${suffix}`,
          ownerId,
        },
      ],
    });

    await prisma.project.createMany({
      data: [
        {
          id: projectAId,
          workspaceId: workspaceAId,
          name: "Tenant integrity project A",
          slug: `tenant-integrity-a-${suffix}`,
        },
        {
          id: projectBId,
          workspaceId: workspaceBId,
          name: "Tenant integrity project B",
          slug: `tenant-integrity-b-${suffix}`,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it("accepts a ticket whose project belongs to its workspace", async () => {
    const ticket = await prisma.ticket.create({
      data: {
        code: `TENANT-VALID-${suffix}`,
        workspaceId: workspaceAId,
        projectId: projectAId,
        title: "Valid tenant-scoped ticket",
        description: "The project and ticket belong to workspace A.",
      },
    });

    expect(ticket.workspaceId).toBe(workspaceAId);
    expect(ticket.projectId).toBe(projectAId);
  });

  it("rejects a project from another workspace at the database boundary", async () => {
    await expect(
      prisma.ticket.create({
        data: {
          code: `TENANT-INVALID-${suffix}`,
          workspaceId: workspaceAId,
          projectId: projectBId,
          title: "Invalid cross-workspace ticket",
          description: "This relationship must not be persisted.",
        },
      })
    ).rejects.toMatchObject({
      code: "P2003",
    });
  });

  it("rejects an embedding whose workspace/project disagrees with its ticket", async () => {
    const ticketId = `tenant-integrity-embedding-${suffix}`;

    await prisma.ticket.create({
      data: {
        id: ticketId,
        code: `TENANT-EMBEDDING-${suffix}`,
        workspaceId: workspaceAId,
        projectId: projectAId,
        title: "Embedding ownership test",
        description: "Its embedding must retain the same tenant ownership.",
      },
    });

    await expect(
      prisma.$executeRaw`
        INSERT INTO "TicketEmbedding" (
          "id", "ticketId", "workspaceId", "projectId", "provider", "model",
          "contentHash", "embedding", "updatedAt"
        ) VALUES (
          ${`embedding-invalid-${suffix}`}, ${ticketId}, ${workspaceBId}, ${projectBId},
          'test', 'test', 'hash-invalid', ${embeddingVector}::vector(768), CURRENT_TIMESTAMP
        )
      `
    ).rejects.toMatchObject({ code: "P2010" });

    await prisma.$executeRaw`
      INSERT INTO "TicketEmbedding" (
        "id", "ticketId", "workspaceId", "projectId", "provider", "model",
        "contentHash", "embedding", "updatedAt"
      ) VALUES (
        ${`embedding-valid-${suffix}`}, ${ticketId}, ${workspaceAId}, ${projectAId},
        'test', 'test', 'hash-valid', ${embeddingVector}::vector(768), CURRENT_TIMESTAMP
      )
    `;

    await prisma.ticket.delete({ where: { id: ticketId } });

    const embeddings = await prisma.$queryRaw<Array<{ ticketId: string }>>`
      SELECT "ticketId"
      FROM "TicketEmbedding"
      WHERE "ticketId" = ${ticketId}
    `;
    expect(embeddings).toEqual([]);
  });
});
