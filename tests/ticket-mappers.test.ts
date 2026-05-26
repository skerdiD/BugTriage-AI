import {
  AttachmentType,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  mapTicketDetailToUiTicket,
  mapTicketListItemToUiTicket,
} from "@/lib/data/ticket-mappers";
import type { TicketDetail, TicketListItem } from "@/lib/data/tickets";

describe("ticket mappers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps list tickets with safe fallback values for missing analysis data", () => {
    const ticket = {
      code: "BUG-1001",
      title: "Checkout submit button stays disabled",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.NEW,
      category: null,
      assignee: null,
      aiAnalysis: null,
      aiConfidence: null,
      priorityScore: null,
      createdAt: new Date("2026-05-08T09:30:00.000Z"),
      updatedAt: new Date("2026-05-08T09:45:00.000Z"),
    } as unknown as TicketListItem;

    const result = mapTicketListItemToUiTicket(ticket);

    expect(result).toMatchObject({
      id: "BUG-1001",
      severity: "High",
      status: "New",
      category: "Uncategorized",
      assignee: "Unassigned",
      confidence: 0,
    });
    expect("originalReport" in result).toBe(false);
    expect("reproductionSteps" in result).toBe(false);
  });

  it("prefers AI analysis data and maps ticket attachments for detail views", () => {
    const ticket = {
      code: "BUG-2024",
      title: "Mobile checkout crashes after payment validation",
      severity: TicketSeverity.CRITICAL,
      status: TicketStatus.IN_PROGRESS,
      category: "Payments",
      assignee: {
        id: "user-2",
        name: "Alex Doe",
      },
      reporter: {
        id: "user-1",
        name: "Taylor Smith",
      },
      workspace: {
        id: "workspace-1",
        name: "BugTriage Workspace",
        slug: "bugtriage-workspace",
      },
      project: {
        id: "project-1",
        name: "Core Platform",
        slug: "core-platform",
      },
      aiAnalysis: {
        id: "analysis-1",
        summary: "AI summary",
        likelyCause: "A stale payment validation state crashes the mobile flow.",
        suggestedFix: "Reset payment state after validation and guard mobile callbacks.",
        reproductionSteps: ["Open checkout", "Validate card", "Observe crash"],
        tags: ["payments", "mobile"],
        confidenceScore: 88,
        ticketId: "ticket-1",
        createdAt: new Date("2026-05-08T09:05:00.000Z"),
        updatedAt: new Date("2026-05-08T09:06:00.000Z"),
      },
      attachments: [
        {
          id: "attachment-1",
          filename: "checkout-crash.png",
          fileType: "image/png",
          fileSize: 2_048,
          storagePath: "private/workspace-1/user-1/tickets/BUG-2024/screenshots/shot.png",
          url: null,
          attachmentType: AttachmentType.SCREENSHOT,
          createdAt: new Date("2026-05-08T09:40:00.000Z"),
          ticketId: "ticket-1",
        },
      ],
      comments: [
        {
          id: "comment-1",
          author: {
            id: "user-2",
            name: "Alex Doe",
          },
          body: "Looking into the payment validation handler now.",
          createdAt: new Date("2026-05-08T09:50:00.000Z"),
          updatedAt: new Date("2026-05-08T09:50:00.000Z"),
          authorId: "user-2",
          ticketId: "ticket-1",
        },
      ],
      activities: [
        {
          id: "activity-1",
          title: "Status changed",
          description: "Ticket moved from NEW to IN_PROGRESS.",
          createdAt: new Date("2026-05-08T09:55:00.000Z"),
          actor: {
            id: "user-2",
            name: "Alex Doe",
          },
          actorId: "user-2",
          metadata: null,
          ticketId: "ticket-1",
          type: "STATUS_CHANGED",
        },
      ],
      aiConfidence: null,
      description: "Support report with mobile crash details.",
      stepsToReproduce: "1. Open checkout\n2. Validate card\n3. Observe crash",
      priorityScore: 95,
      browser: "safari",
      device: "ios-mobile",
      environment: "production",
      affectedPage: "/checkout/payment",
      createdAt: new Date("2026-05-08T09:00:00.000Z"),
      updatedAt: new Date("2026-05-08T09:58:00.000Z"),
    } as unknown as TicketDetail;

    const result = mapTicketDetailToUiTicket(ticket, {
      "attachment-1": "https://download.example/checkout-crash.png",
    });

    expect(result).toMatchObject({
      id: "BUG-2024",
      severity: "Critical",
      status: "In Progress",
      assignee: "Alex Doe",
      confidence: 88,
      tags: ["payments", "mobile"],
      possibleRootCause:
        "A stale payment validation state crashes the mobile flow.",
      suggestedFix:
        "Reset payment state after validation and guard mobile callbacks.",
    });
    expect(result.reproductionSteps).toEqual([
      "Open checkout",
      "Validate card",
      "Observe crash",
    ]);
    expect(result.attachments[0]).toMatchObject({
      id: "attachment-1",
      type: "screenshot",
      size: "2 KB",
      downloadUrl: "https://download.example/checkout-crash.png",
    });
    expect(result.comments[0]?.author).toBe("Alex Doe");
    expect(result.activity[0]?.title).toBe("Status changed");
  });
});
