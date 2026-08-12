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
});
