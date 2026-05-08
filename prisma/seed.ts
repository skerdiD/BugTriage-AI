import {
  AttachmentType,
  PrismaClient,
  TicketActivityType,
  TicketSeverity,
  TicketStatus,
  WorkspaceRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

async function main() {
  await prisma.ticketActivity.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketAiAnalysis.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const sarah = await prisma.user.create({
    data: {
      email: "sarah@bugtriage.ai",
      name: "Sarah Chen",
      avatarUrl: null,
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: "alex@bugtriage.ai",
      name: "Alex Rivera",
      avatarUrl: null,
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: "jordan@bugtriage.ai",
      name: "Jordan Lee",
      avatarUrl: null,
    },
  });

  const taylor = await prisma.user.create({
    data: {
      email: "taylor@bugtriage.ai",
      name: "Taylor Morgan",
      avatarUrl: null,
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: "sam@bugtriage.ai",
      name: "Sam Chen",
      avatarUrl: null,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "BugTriage AI",
      slug: "bugtriage-ai",
      ownerId: sarah.id,
      members: {
        create: [
          {
            userId: sarah.id,
            role: WorkspaceRole.OWNER,
          },
          {
            userId: alex.id,
            role: WorkspaceRole.ADMIN,
          },
          {
            userId: jordan.id,
            role: WorkspaceRole.MEMBER,
          },
          {
            userId: taylor.id,
            role: WorkspaceRole.MEMBER,
          },
          {
            userId: sam.id,
            role: WorkspaceRole.MEMBER,
          },
        ],
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Core SaaS Platform",
      slug: "core-saas-platform",
      description:
        "Main customer-facing application where bug reports, dashboards, and product workflows are tracked.",
    },
  });

  await prisma.ticket.create({
    data: {
      code: "BUG-2847",
      workspaceId: workspace.id,
      projectId: project.id,
      reporterId: sarah.id,
      assigneeId: alex.id,
      title: "Payment form fails on Safari mobile",
      description:
        "A customer reported that checkout becomes unresponsive on Safari iOS after entering valid card details. The submit button remains disabled, and refreshing the page is the only way to try again. The issue happened twice during payment on production.",
      expectedBehavior:
        "Payment form should submit successfully and process the transaction.",
      actualBehavior:
        "Submit button remains disabled and the checkout page becomes unresponsive.",
      stepsToReproduce:
        "1. Open the checkout payment page on Safari iOS.\n2. Fill in shipping and billing details.\n3. Enter valid credit card information.\n4. Observe that the payment submit button remains disabled.\n5. Try refreshing and repeating the flow.",
      browser: "Safari 17",
      device: "iPhone 15 Pro",
      environment: "Production",
      affectedPage: "/checkout/payment",
      severity: TicketSeverity.CRITICAL,
      status: TicketStatus.INVESTIGATING,
      category: "Payment",
      priorityScore: 96,
      aiConfidence: 94,
      aiAnalysis: {
        create: {
          summary:
            "Safari iOS users may be blocked from completing checkout because the payment form does not re-enable submission after valid card data is entered.",
          likelyCause:
            "The payment form may depend on an input validation event or payment intent response that behaves differently in Safari iOS, leaving the submit state locked in a disabled state.",
          suggestedFix:
            "Audit the payment form state machine, add defensive checks for payment intent creation, verify Safari input events, and ensure submit availability is recalculated after every card input change.",
          reproductionSteps: [
            "Open the checkout payment page on Safari iOS.",
            "Fill in shipping and billing details.",
            "Enter valid credit card information.",
            "Observe that the payment submit button remains disabled.",
          ],
          tags: ["safari-ios", "checkout", "payment", "frontend", "revenue-impact"],
          confidenceScore: 94,
          rawAiResponse: {
            model: "mock-gemini",
            severity: "CRITICAL",
            category: "Payment",
            priorityScore: 96,
          },
        },
      },
      attachments: {
        create: [
          {
            filename: "safari-payment-disabled.png",
            fileType: "image/png",
            fileSize: 842000,
            storagePath: "tickets/BUG-2847/safari-payment-disabled.png",
            url: null,
            attachmentType: AttachmentType.SCREENSHOT,
          },
          {
            filename: "payment-form-console.log",
            fileType: "text/plain",
            fileSize: 18000,
            storagePath: "tickets/BUG-2847/payment-form-console.log",
            url: null,
            attachmentType: AttachmentType.LOG,
          },
        ],
      },
      comments: {
        create: [
          {
            authorId: alex.id,
            body: "I will check the card input validation state and compare Safari iOS behavior against Chrome mobile.",
          },
          {
            authorId: sarah.id,
            body: "High priority because this blocks revenue flow. Please verify whether this affects all Safari versions or only latest iOS.",
          },
        ],
      },
      activities: {
        create: [
          {
            actorId: sarah.id,
            type: TicketActivityType.CREATED,
            title: "Bug submitted",
            description: "Raw report was submitted with screenshot and console log.",
          },
          {
            actorId: sarah.id,
            type: TicketActivityType.AI_ANALYZED,
            title: "AI triage completed",
            description: "Severity set to Critical with 94% confidence.",
            metadata: {
              confidence: 94,
              severity: "CRITICAL",
            },
          },
          {
            actorId: sarah.id,
            type: TicketActivityType.ASSIGNED,
            title: "Assigned to Alex Rivera",
            description: "AI recommended frontend ownership based on affected component.",
          },
          {
            actorId: alex.id,
            type: TicketActivityType.STATUS_CHANGED,
            title: "Status changed",
            description: "Ticket moved from New to Investigating.",
            metadata: {
              from: "NEW",
              to: "INVESTIGATING",
            },
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "BUG-2846",
      workspaceId: workspace.id,
      projectId: project.id,
      reporterId: sarah.id,
      assigneeId: jordan.id,
      title: "Dashboard widgets not loading for users in EU region",
      description:
        "Several EU users reported that analytics dashboard widgets stay in a loading state. The sidebar and shell load correctly, but revenue, traffic, and issue trend cards do not render.",
      expectedBehavior:
        "Dashboard widgets should load analytics data for all supported regions.",
      actualBehavior:
        "The dashboard shell loads, but analytics widgets remain stuck in loading state.",
      stepsToReproduce:
        "1. Open the dashboard from an EU-based network.\n2. Wait for analytics cards to load.\n3. Observe that the main app shell loads but widgets remain in loading state.\n4. Open network tab and inspect analytics API calls.",
      browser: "Chrome 124",
      device: "Desktop",
      environment: "Production",
      affectedPage: "/dashboard",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.IN_PROGRESS,
      category: "Performance",
      priorityScore: 88,
      aiConfidence: 89,
      aiAnalysis: {
        create: {
          summary:
            "Dashboard data widgets appear to stall for EU users, likely because regional API responses are timing out or returning incomplete payloads.",
          likelyCause:
            "Regional latency or an API timeout may cause dashboard data fetching to fail silently before the UI receives a complete payload.",
          suggestedFix:
            "Add timeout handling, inspect regional API logs, improve loading fallback states, and verify database region performance for analytics queries.",
          reproductionSteps: [
            "Open the dashboard from an EU-based network.",
            "Wait for analytics cards to load.",
            "Observe widgets stuck in loading state.",
            "Inspect analytics API calls in network tools.",
          ],
          tags: ["dashboard", "eu-region", "api-timeout", "performance"],
          confidenceScore: 89,
          rawAiResponse: {
            model: "mock-gemini",
            severity: "HIGH",
            category: "Performance",
            priorityScore: 88,
          },
        },
      },
      attachments: {
        create: [
          {
            filename: "dashboard-loading-state.png",
            fileType: "image/png",
            fileSize: 624000,
            storagePath: "tickets/BUG-2846/dashboard-loading-state.png",
            url: null,
            attachmentType: AttachmentType.SCREENSHOT,
          },
          {
            filename: "analytics-network-log.json",
            fileType: "application/json",
            fileSize: 31000,
            storagePath: "tickets/BUG-2846/analytics-network-log.json",
            url: null,
            attachmentType: AttachmentType.LOG,
          },
        ],
      },
      comments: {
        create: [
          {
            authorId: jordan.id,
            body: "Checking regional API logs and query timing for the dashboard analytics endpoint.",
          },
        ],
      },
      activities: {
        create: [
          {
            actorId: sarah.id,
            type: TicketActivityType.CREATED,
            title: "Bug submitted",
            description: "Multiple support reports were grouped into one ticket.",
          },
          {
            actorId: sarah.id,
            type: TicketActivityType.AI_ANALYZED,
            title: "AI triage completed",
            description: "Severity set to High with 89% confidence.",
            metadata: {
              confidence: 89,
              severity: "HIGH",
            },
          },
          {
            actorId: jordan.id,
            type: TicketActivityType.STATUS_CHANGED,
            title: "Status changed",
            description: "Ticket moved to In Progress.",
            metadata: {
              from: "INVESTIGATING",
              to: "IN_PROGRESS",
            },
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "BUG-2845",
      workspaceId: workspace.id,
      projectId: project.id,
      reporterId: sarah.id,
      assigneeId: taylor.id,
      title: "Profile image upload shows incorrect file size error",
      description:
        "A user tried uploading a 1.2 MB JPG avatar, but the UI displayed a file size error saying the image exceeded 10 MB.",
      expectedBehavior:
        "Valid image files below 10 MB should upload without showing a size error.",
      actualBehavior:
        "The upload UI rejects a valid 1.2 MB image with an incorrect max-size error.",
      stepsToReproduce:
        "1. Open profile settings.\n2. Choose a valid JPG image below 10 MB.\n3. Upload the image.\n4. Observe incorrect file size validation error.",
      browser: "Chrome 124",
      device: "Desktop",
      environment: "Production",
      affectedPage: "/profile/settings",
      severity: TicketSeverity.MEDIUM,
      status: TicketStatus.NEW,
      category: "UI/UX",
      priorityScore: 64,
      aiConfidence: 92,
      aiAnalysis: {
        create: {
          summary:
            "The profile image upload UI is showing an incorrect size validation error for valid image files.",
          likelyCause:
            "The UI may be reading file size metadata incorrectly or applying validation before file normalization.",
          suggestedFix:
            "Review upload validation logic, confirm byte-to-megabyte conversion, and improve error messaging around file constraints.",
          reproductionSteps: [
            "Open profile settings.",
            "Choose a valid JPG image below 10 MB.",
            "Upload the image.",
            "Observe incorrect file size validation error.",
          ],
          tags: ["upload", "profile", "validation", "ui"],
          confidenceScore: 92,
          rawAiResponse: {
            model: "mock-gemini",
            severity: "MEDIUM",
            category: "UI/UX",
            priorityScore: 64,
          },
        },
      },
      attachments: {
        create: [
          {
            filename: "profile-upload-error.png",
            fileType: "image/png",
            fileSize: 411000,
            storagePath: "tickets/BUG-2845/profile-upload-error.png",
            url: null,
            attachmentType: AttachmentType.SCREENSHOT,
          },
        ],
      },
      comments: {
        create: [
          {
            authorId: taylor.id,
            body: "Looks like a validation copy or unit conversion problem. I will inspect the upload helper.",
          },
        ],
      },
      activities: {
        create: [
          {
            actorId: sarah.id,
            type: TicketActivityType.CREATED,
            title: "Bug submitted",
            description: "User reported incorrect image size validation.",
          },
          {
            actorId: sarah.id,
            type: TicketActivityType.AI_ANALYZED,
            title: "AI triage completed",
            description: "Severity set to Medium with 92% confidence.",
            metadata: {
              confidence: 92,
              severity: "MEDIUM",
            },
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "BUG-2844",
      workspaceId: workspace.id,
      projectId: project.id,
      reporterId: sarah.id,
      assigneeId: sam.id,
      title: "Email notifications delayed by 15+ minutes",
      description:
        "Users receive notification emails 15 to 25 minutes after the triggering event. This affects invites, comments, and critical alert emails.",
      expectedBehavior:
        "Notification emails should be delivered close to the triggering event.",
      actualBehavior:
        "Notification emails are delayed by 15 to 25 minutes across multiple event types.",
      stepsToReproduce:
        "1. Trigger a workspace invite.\n2. Add a comment to an active ticket.\n3. Trigger a critical alert event.\n4. Compare event timestamp with received email timestamp.",
      browser: "Edge 123",
      device: "Desktop",
      environment: "Production",
      affectedPage: "notification-worker",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.IN_PROGRESS,
      category: "Backend",
      priorityScore: 84,
      aiConfidence: 87,
      aiAnalysis: {
        create: {
          summary:
            "Email notification delivery is delayed across multiple event types, suggesting queue processing or provider latency issues.",
          likelyCause:
            "The notification queue may be backed up, retrying failed jobs, or waiting on slow email provider responses.",
          suggestedFix:
            "Inspect queue worker throughput, provider response times, retry logic, and alert delivery priority.",
          reproductionSteps: [
            "Trigger a workspace invite.",
            "Add a comment to an active ticket.",
            "Trigger a critical alert event.",
            "Compare event timestamp with received email timestamp.",
          ],
          tags: ["email", "notifications", "queue", "backend"],
          confidenceScore: 87,
          rawAiResponse: {
            model: "mock-gemini",
            severity: "HIGH",
            category: "Backend",
            priorityScore: 84,
          },
        },
      },
      attachments: {
        create: [
          {
            filename: "notification-worker.log",
            fileType: "text/plain",
            fileSize: 44000,
            storagePath: "tickets/BUG-2844/notification-worker.log",
            url: null,
            attachmentType: AttachmentType.LOG,
          },
        ],
      },
      comments: {
        create: [
          {
            authorId: sam.id,
            body: "Queue depth looks higher than expected. Investigating worker scaling and provider retry behavior.",
          },
        ],
      },
      activities: {
        create: [
          {
            actorId: sarah.id,
            type: TicketActivityType.CREATED,
            title: "Bug submitted",
            description: "Support escalated delayed notification emails.",
          },
          {
            actorId: sarah.id,
            type: TicketActivityType.AI_ANALYZED,
            title: "AI triage completed",
            description: "Severity set to High with 87% confidence.",
            metadata: {
              confidence: 87,
              severity: "HIGH",
            },
          },
          {
            actorId: sam.id,
            type: TicketActivityType.STATUS_CHANGED,
            title: "Status changed",
            description: "Ticket moved to In Progress.",
            metadata: {
              from: "INVESTIGATING",
              to: "IN_PROGRESS",
            },
          },
        ],
      },
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
