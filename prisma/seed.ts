import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PrismaClient,
  TicketActivityType,
  TicketSeverity,
  TicketStatus,
  WorkspaceRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "../src/lib/demo";

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

export const DEFAULT_DEMO_USER_EMAIL = DEMO_USER_EMAIL;
export const DEMO_TICKET_CODE_PREFIX = "DEMO-";
export const DEMO_WORKSPACE_SLUG = "bugtriage-ai-demo";
export const LEGACY_DEMO_WORKSPACE_SLUG = "portfolio-demo-mirejemi";
export const DEMO_WORKSPACE_NAME = "BugTriage Demo";
export const DEMO_PROJECT_SLUG = "saas-platform";
export const LEGACY_DEMO_PROJECT_SLUG = "saas-demo-workspace";
export const DEMO_PROJECT_NAME = "SaaS Platform";
export const DEMO_PROJECT_DESCRIPTION =
  "Demo project with realistic tickets and AI triage results.";

const DEMO_TEAM_MEMBERS = [
  {
    email: "maya.chen@demo.bugtriage.ai",
    name: "Maya Chen",
    role: WorkspaceRole.ADMIN,
  },
  {
    email: "jon.bell@demo.bugtriage.ai",
    name: "Jon Bell",
    role: WorkspaceRole.MEMBER,
  },
  {
    email: "priya.shah@demo.bugtriage.ai",
    name: "Priya Shah",
    role: WorkspaceRole.MEMBER,
  },
] as const;

type DemoCommentSeed = {
  body: string;
  createdAt: Date;
};

type DemoActivitySeed = {
  type: TicketActivityType;
  title: string;
  description: string;
  createdAt: Date;
  metadata?: Record<string, string | number | boolean | null>;
};

type DemoTicketSeed = {
  code: string;
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  stepsToReproduce: string;
  browser: string;
  device: string;
  environment: string;
  affectedPage: string;
  severity: TicketSeverity;
  status: TicketStatus;
  category: string;
  priorityScore: number;
  aiConfidence: number;
  createdAt: Date;
  updatedAt: Date;
  aiSummary: string;
  likelyCause: string;
  suggestedFix: string;
  reproductionSteps: string[];
  tags: string[];
  comments: DemoCommentSeed[];
  activities: DemoActivitySeed[];
};

function daysAgo(days: number, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function hoursAfter(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function getObsoleteDemoTicketCodes(
  existingDemoCodes: string[],
  currentDemoCodes: string[]
) {
  return existingDemoCodes.filter((code) => !currentDemoCodes.includes(code));
}

export function buildDemoTickets(): DemoTicketSeed[] {
  const loginCreatedAt = daysAgo(22, 9, 15);
  const chartFreezeCreatedAt = daysAgo(18, 11, 10);
  const uploadCreatedAt = daysAgo(14, 14, 20);
  const inviteCreatedAt = daysAgo(11, 10, 35);
  const analyticsSlowCreatedAt = daysAgo(8, 13, 5);
  const commentButtonCreatedAt = daysAgo(5, 16, 10);
  const passwordResetCreatedAt = daysAgo(3, 9, 25);
  const activityFeedCreatedAt = daysAgo(1, 12, 45);

  return [
    {
      code: "DEMO-1001",
      title: "Login fails on mobile Safari after successful password entry",
      description:
        "Several customers reported that the sign-in form refreshes without creating a session on mobile Safari. Credentials are accepted, but the user remains on the login screen with no visible error.",
      expectedBehavior:
        "Users should land in the dashboard immediately after a valid login attempt.",
      actualBehavior:
        "The form submits, briefly shows a loading state, and then returns to the login page without establishing a session.",
      stepsToReproduce:
        "1. Open the login page on mobile Safari.\n2. Enter a valid email and password.\n3. Tap Sign in.\n4. Observe that the page refreshes but the session is not created.",
      browser: "Safari 17",
      device: "iPhone 15 Pro",
      environment: "production",
      affectedPage: "/login",
      severity: TicketSeverity.CRITICAL,
      status: TicketStatus.INVESTIGATING,
      category: "Authentication",
      priorityScore: 97,
      aiConfidence: 95,
      createdAt: loginCreatedAt,
      updatedAt: hoursAfter(loginCreatedAt, 30),
      aiSummary:
        "Mobile Safari appears to complete credential submission but fails to persist or finalize the auth session redirect.",
      likelyCause:
        "Session cookies or auth callback handling may be inconsistent on Safari mobile, especially after redirect-based sign-in completion.",
      suggestedFix:
        "Inspect auth callback response handling, verify cookie persistence on Safari, and add explicit failure messaging when the exchange succeeds but no session is restored.",
      reproductionSteps: [
        "Open the login page on mobile Safari.",
        "Submit valid credentials.",
        "Observe the page refresh without entering the dashboard.",
      ],
      tags: ["auth", "mobile-safari", "session", "login"],
      comments: [
        {
          body: "Support confirmed this happened to three customers this week, all on iPhone Safari.",
          createdAt: hoursAfter(loginCreatedAt, 3),
        },
        {
          body: "Checking whether the auth callback is returning a valid session but losing the cookie on redirect.",
          createdAt: hoursAfter(loginCreatedAt, 28),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Customer support escalated a production login issue from mobile Safari.",
          createdAt: loginCreatedAt,
          metadata: {
            source: "support",
          },
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The draft marked this as Critical with high confidence.",
          createdAt: hoursAfter(loginCreatedAt, 0.5),
          metadata: {
            confidence: 95,
            severity: "CRITICAL",
          },
        },
        {
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: "Ticket moved from New to Investigating.",
          createdAt: hoursAfter(loginCreatedAt, 24),
          metadata: {
            from: "NEW",
            to: "INVESTIGATING",
          },
        },
      ],
    },
    {
      code: "DEMO-1002",
      title: "Dashboard chart freezes after applying multiple date filters",
      description:
        "The analytics trend chart becomes unresponsive after users switch between several date ranges in the same session. The rest of the dashboard remains interactive, but the chart area stops updating.",
      expectedBehavior:
        "Charts should recalculate and render cleanly whenever users change dashboard filters.",
      actualBehavior:
        "The chart stops animating and does not update after the third or fourth filter change.",
      stepsToReproduce:
        "1. Open the dashboard analytics area.\n2. Change the date range multiple times.\n3. Toggle between weekly and monthly views.\n4. Observe the chart freeze in place.",
      browser: "Chrome 124",
      device: "Desktop",
      environment: "production",
      affectedPage: "/dashboard",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.IN_PROGRESS,
      category: "Dashboard",
      priorityScore: 86,
      aiConfidence: 91,
      createdAt: chartFreezeCreatedAt,
      updatedAt: hoursAfter(chartFreezeCreatedAt, 42),
      aiSummary:
        "Client-side chart state appears to accumulate stale filter transitions, eventually causing the rendered data series to stop responding.",
      likelyCause:
        "A chart re-render or data transform path may be reusing stale values after repeated filter transitions.",
      suggestedFix:
        "Review chart state reset behavior during filter changes and confirm that each transition receives a fresh dataset and key.",
      reproductionSteps: [
        "Open dashboard analytics.",
        "Change date filters repeatedly.",
        "Observe the chart no longer reacting to filter updates.",
      ],
      tags: ["dashboard", "charts", "filters", "frontend"],
      comments: [
        {
          body: "This looks reproducible after several quick filter changes, especially if animations are still running.",
          createdAt: hoursAfter(chartFreezeCreatedAt, 5),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Internal QA reported a chart rendering regression during dashboard review.",
          createdAt: chartFreezeCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft suggested stale client state in the chart rendering flow.",
          createdAt: hoursAfter(chartFreezeCreatedAt, 0.4),
          metadata: {
            confidence: 91,
            severity: "HIGH",
          },
        },
        {
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: "Ticket moved from Investigating to In Progress.",
          createdAt: hoursAfter(chartFreezeCreatedAt, 40),
          metadata: {
            from: "INVESTIGATING",
            to: "IN_PROGRESS",
          },
        },
      ],
    },
    {
      code: "DEMO-1003",
      title: "File upload returns 500 for large PNG despite client-side validation passing",
      description:
        "The bug submission flow accepts a large PNG on the client, but the request fails with a server error during upload. The user only sees a generic failure message after waiting several seconds.",
      expectedBehavior:
        "Uploads that exceed safe limits should fail early with a clear validation message, and valid files should upload successfully.",
      actualBehavior:
        "The form waits, then returns a generic upload failure after the server responds with an error.",
      stepsToReproduce:
        "1. Open Submit Bug.\n2. Attach a large PNG screenshot.\n3. Submit the report.\n4. Observe a delayed server failure instead of a clear validation result.",
      browser: "Edge 123",
      device: "Windows laptop",
      environment: "production",
      affectedPage: "/submit-bug",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.NEW,
      category: "File Uploads",
      priorityScore: 82,
      aiConfidence: 88,
      createdAt: uploadCreatedAt,
      updatedAt: uploadCreatedAt,
      aiSummary:
        "Upload validation appears to allow a screenshot that later fails server-side, leading to a slow and confusing submission experience.",
      likelyCause:
        "The client-side file checks and server-side storage validation may not be using the same effective size or content rules.",
      suggestedFix:
        "Align upload validation rules across client and server and return a user-facing message as early as possible for blocked files.",
      reproductionSteps: [
        "Attach a large PNG in Submit Bug.",
        "Submit the report.",
        "Observe delayed 500-style failure behavior.",
      ],
      tags: ["uploads", "storage", "validation", "submit-bug"],
      comments: [
        {
          body: "We should verify whether this is a file-size mismatch or an upstream storage rejection.",
          createdAt: hoursAfter(uploadCreatedAt, 2),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Reporter attached a screenshot and hit an upload failure during bug submission.",
          createdAt: uploadCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft suggested mismatched validation between the client and server upload paths.",
          createdAt: hoursAfter(uploadCreatedAt, 0.35),
          metadata: {
            confidence: 88,
            severity: "HIGH",
          },
        },
      ],
    },
    {
      code: "DEMO-1004",
      title: "Invite link redirects to the wrong workspace after acceptance",
      description:
        "A teammate accepted an invite successfully but landed back in their personal workspace instead of the shared team workspace. They had access, but the landing context was confusing and made the invite look broken.",
      expectedBehavior:
        "After accepting an invite, the user should land inside the invited workspace with the correct workspace and project selected.",
      actualBehavior:
        "The invite is accepted, but the user is redirected into a different workspace context.",
      stepsToReproduce:
        "1. Create a workspace invite.\n2. Sign in with the invited account.\n3. Accept the invite.\n4. Observe the app redirect to the wrong workspace context.",
      browser: "Chrome 124",
      device: "MacBook Pro",
      environment: "staging",
      affectedPage: "/invite/[token]",
      severity: TicketSeverity.MEDIUM,
      status: TicketStatus.FIXED,
      category: "Workspaces",
      priorityScore: 67,
      aiConfidence: 87,
      createdAt: inviteCreatedAt,
      updatedAt: hoursAfter(inviteCreatedAt, 32),
      aiSummary:
        "Workspace invite acceptance appears to complete correctly, but the post-accept redirect does not consistently restore the invited workspace context.",
      likelyCause:
        "Workspace or project cookie state may be overwritten by an older selection during redirect handling.",
      suggestedFix:
        "Persist the invited workspace and project explicitly after acceptance and verify redirect precedence over older cookie values.",
      reproductionSteps: [
        "Create a workspace invite.",
        "Accept it with a valid account.",
        "Confirm the app redirects into the wrong workspace context.",
      ],
      tags: ["invites", "workspace", "redirects", "session"],
      comments: [
        {
          body: "The acceptance flow itself works. The issue is the context after redirect, not the membership creation.",
          createdAt: hoursAfter(inviteCreatedAt, 8),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Workspace invite flow produced an incorrect post-accept landing context.",
          createdAt: inviteCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft highlighted redirect precedence and cookie state as possible causes.",
          createdAt: hoursAfter(inviteCreatedAt, 0.25),
          metadata: {
            confidence: 87,
            severity: "MEDIUM",
          },
        },
        {
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: "Ticket moved from In Progress to Fixed.",
          createdAt: hoursAfter(inviteCreatedAt, 31),
          metadata: {
            from: "IN_PROGRESS",
            to: "FIXED",
          },
        },
      ],
    },
    {
      code: "DEMO-1005",
      title: "Analytics page loads slowly when the workspace has many tickets",
      description:
        "The analytics screen becomes noticeably slow for larger workspaces. Charts eventually load, but the initial render can take several seconds and feels blocked.",
      expectedBehavior:
        "Analytics should feel responsive even when the workspace contains a healthy volume of historical tickets.",
      actualBehavior:
        "Page render stalls before charts and summary metrics appear.",
      stepsToReproduce:
        "1. Open Analytics for a larger workspace.\n2. Wait for charts and summary cards.\n3. Observe the delayed first render.",
      browser: "Firefox 126",
      device: "Desktop",
      environment: "production",
      affectedPage: "/analytics",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.IN_PROGRESS,
      category: "Performance",
      priorityScore: 84,
      aiConfidence: 90,
      createdAt: analyticsSlowCreatedAt,
      updatedAt: hoursAfter(analyticsSlowCreatedAt, 27),
      aiSummary:
        "Analytics reporting appears functionally correct but slow under larger ticket volumes, likely due to broader in-memory aggregation work.",
      likelyCause:
        "The reporting path may be reading more ticket rows than necessary before transforming them for charts and insights.",
      suggestedFix:
        "Measure analytics query scope, tighten result limits where possible, and move heavier aggregation work closer to the database when needed.",
      reproductionSteps: [
        "Open Analytics for a larger workspace.",
        "Observe delayed chart and metric rendering.",
      ],
      tags: ["analytics", "performance", "reporting", "prisma"],
      comments: [
        {
          body: "No correctness issues so far, but the page feels sluggish compared with dashboard and tickets.",
          createdAt: hoursAfter(analyticsSlowCreatedAt, 6),
        },
        {
          body: "Worth profiling the reporting data path before adding more chart cards.",
          createdAt: hoursAfter(analyticsSlowCreatedAt, 25),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Product review flagged slower-than-expected analytics loading in demo data scale tests.",
          createdAt: analyticsSlowCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft marked the issue as performance-related with high confidence.",
          createdAt: hoursAfter(analyticsSlowCreatedAt, 0.3),
          metadata: {
            confidence: 90,
            severity: "HIGH",
          },
        },
        {
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: "Ticket moved from Investigating to In Progress.",
          createdAt: hoursAfter(analyticsSlowCreatedAt, 24),
          metadata: {
            from: "INVESTIGATING",
            to: "IN_PROGRESS",
          },
        },
      ],
    },
    {
      code: "DEMO-1006",
      title: "Comment submit button stays disabled after entering valid text",
      description:
        "On the ticket detail page, the comment textarea accepts input but the submit control occasionally remains disabled until the page is refreshed.",
      expectedBehavior:
        "Typing valid comment text should enable the comment submit action immediately.",
      actualBehavior:
        "The button remains disabled even after text is entered.",
      stepsToReproduce:
        "1. Open a ticket detail page.\n2. Type a valid internal note.\n3. Observe that the submit control sometimes remains disabled.\n4. Refresh and try again.",
      browser: "Chrome 124",
      device: "Desktop",
      environment: "staging",
      affectedPage: "/tickets/[ticketId]",
      severity: TicketSeverity.MEDIUM,
      status: TicketStatus.NEW,
      category: "Comments",
      priorityScore: 59,
      aiConfidence: 83,
      createdAt: commentButtonCreatedAt,
      updatedAt: commentButtonCreatedAt,
      aiSummary:
        "The comment composer seems to enter a stale disabled state despite valid user input.",
      likelyCause:
        "A pending state or controlled input transition may not be clearing correctly after previous submissions or page loads.",
      suggestedFix:
        "Audit comment form disabled logic, pending state transitions, and validation conditions around empty versus trimmed content.",
      reproductionSteps: [
        "Open a ticket detail view.",
        "Type a valid comment.",
        "Observe the submit control remain disabled.",
      ],
      tags: ["comments", "ui", "forms", "tickets"],
      comments: [
        {
          body: "This one feels intermittent, but QA reproduced it twice after a failed comment submit.",
          createdAt: hoursAfter(commentButtonCreatedAt, 4),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Internal note composer reported as unreliable during ticket review.",
          createdAt: commentButtonCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft suggested stale pending form state as a place to investigate.",
          createdAt: hoursAfter(commentButtonCreatedAt, 0.2),
          metadata: {
            confidence: 83,
            severity: "MEDIUM",
          },
        },
      ],
    },
    {
      code: "DEMO-1007",
      title: "Password reset email not received for valid production accounts",
      description:
        "Users requested password resets successfully, but no email arrived in their inbox. The UI shows success, which makes the issue hard to detect until the user retries multiple times.",
      expectedBehavior:
        "A successful password reset request should result in a deliverable email or a clear fallback warning if delivery fails.",
      actualBehavior:
        "The UI shows success, but the email never arrives for some users.",
      stepsToReproduce:
        "1. Open Forgot Password.\n2. Submit a valid production email.\n3. Observe the success message.\n4. Check inbox and spam with no email received.",
      browser: "Safari 17",
      device: "MacBook Air",
      environment: "production",
      affectedPage: "/login",
      severity: TicketSeverity.HIGH,
      status: TicketStatus.CLOSED,
      category: "Email",
      priorityScore: 79,
      aiConfidence: 86,
      createdAt: passwordResetCreatedAt,
      updatedAt: hoursAfter(passwordResetCreatedAt, 18),
      aiSummary:
        "Password reset requests appear to succeed at the UI layer, but email delivery is unreliable or silently failing downstream.",
      likelyCause:
        "The auth provider or email configuration may be accepting the request without guaranteeing downstream delivery visibility.",
      suggestedFix:
        "Review provider delivery logs, surface delivery failures when available, and consider user-facing guidance for delayed emails.",
      reproductionSteps: [
        "Submit a valid password reset request.",
        "Observe success in the UI.",
        "Check inbox and spam folders with no email received.",
      ],
      tags: ["email", "auth", "password-reset", "delivery"],
      comments: [
        {
          body: "Resolved after updating the email provider configuration and confirming delivery logs.",
          createdAt: hoursAfter(passwordResetCreatedAt, 17),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Password reset requests were not reaching some production users.",
          createdAt: passwordResetCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft pointed to downstream email delivery rather than form validation.",
          createdAt: hoursAfter(passwordResetCreatedAt, 0.15),
          metadata: {
            confidence: 86,
            severity: "HIGH",
          },
        },
        {
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: "Ticket moved from Fixed to Closed after verification.",
          createdAt: hoursAfter(passwordResetCreatedAt, 18),
          metadata: {
            from: "FIXED",
            to: "CLOSED",
          },
        },
      ],
    },
    {
      code: "DEMO-1008",
      title: "Ticket status change does not update the activity feed until refresh",
      description:
        "When a ticket status changes, the detail page reflects the new badge, but the activity feed does not show the new status event until the user refreshes the page.",
      expectedBehavior:
        "The activity feed should reflect the new status change immediately after the update completes.",
      actualBehavior:
        "The status badge updates, but the activity timeline lags behind until a manual refresh.",
      stepsToReproduce:
        "1. Open a ticket detail page.\n2. Change the status.\n3. Observe the updated badge.\n4. Notice the activity feed missing the new event until refresh.",
      browser: "Chrome 124",
      device: "Desktop",
      environment: "production",
      affectedPage: "/tickets/[ticketId]",
      severity: TicketSeverity.MEDIUM,
      status: TicketStatus.FIXED,
      category: "Activity Feed",
      priorityScore: 63,
      aiConfidence: 89,
      createdAt: activityFeedCreatedAt,
      updatedAt: hoursAfter(activityFeedCreatedAt, 6),
      aiSummary:
        "Ticket status updates persist correctly, but the corresponding activity UI appears to lag behind the new server state.",
      likelyCause:
        "The status mutation may succeed without fully refreshing or invalidating the detail view that powers the activity list.",
      suggestedFix:
        "Verify revalidation behavior after status changes and ensure the detail route refreshes the activity data immediately.",
      reproductionSteps: [
        "Open a ticket detail page.",
        "Change the ticket status.",
        "Observe the activity feed not updating until refresh.",
      ],
      tags: ["tickets", "activity-feed", "revalidation", "ux"],
      comments: [
        {
          body: "Looks like the write succeeds. The mismatch is between the updated badge and stale activity list render.",
          createdAt: hoursAfter(activityFeedCreatedAt, 2),
        },
      ],
      activities: [
        {
          type: TicketActivityType.CREATED,
          title: "Bug submitted",
          description: "Reporter noticed stale activity feed behavior after changing ticket status.",
          createdAt: activityFeedCreatedAt,
        },
        {
          type: TicketActivityType.AI_ANALYZED,
          title: "Triage draft ready",
          description: "The triage draft suggested a route revalidation gap after the status update.",
          createdAt: hoursAfter(activityFeedCreatedAt, 0.2),
          metadata: {
            confidence: 89,
            severity: "MEDIUM",
          },
        },
        {
          type: TicketActivityType.STATUS_CHANGED,
          title: "Status changed",
          description: "Ticket moved from In Progress to Fixed.",
          createdAt: hoursAfter(activityFeedCreatedAt, 5.5),
          metadata: {
            from: "IN_PROGRESS",
            to: "FIXED",
          },
        },
      ],
    },
  ];
}

async function ensureDemoWorkspace(user: { id: string; name: string }) {
  const existingWorkspace = await prisma.workspace.findUnique({
    where: {
      slug: DEMO_WORKSPACE_SLUG,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (existingWorkspace && existingWorkspace.ownerId !== user.id) {
    throw new Error(
      `The demo workspace slug "${DEMO_WORKSPACE_SLUG}" already belongs to another user. Choose a different demo workspace slug before seeding.`
    );
  }

  const workspace = existingWorkspace
    ? await prisma.workspace.update({
        where: {
          id: existingWorkspace.id,
        },
        data: {
          name: DEMO_WORKSPACE_NAME,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : await prisma.workspace.create({
        data: {
          name: DEMO_WORKSPACE_NAME,
          slug: DEMO_WORKSPACE_SLUG,
          ownerId: user.id,
        },
        select: {
          id: true,
          name: true,
        },
      });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {
      role: WorkspaceRole.OWNER,
    },
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.OWNER,
    },
  });

  return workspace;
}

async function ensureDemoProject(workspaceId: string) {
  const currentProject = await prisma.project.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId,
        slug: DEMO_PROJECT_SLUG,
      },
    },
    select: {
      id: true,
    },
  });
  const existingProject =
    currentProject ??
    (await prisma.project.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: LEGACY_DEMO_PROJECT_SLUG,
        },
      },
      select: {
        id: true,
      },
    }));

  if (existingProject) {
    return prisma.project.update({
      where: {
        id: existingProject.id,
      },
      data: {
        slug: DEMO_PROJECT_SLUG,
        name: DEMO_PROJECT_NAME,
        description: DEMO_PROJECT_DESCRIPTION,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  return prisma.project.create({
    data: {
      workspaceId,
      name: DEMO_PROJECT_NAME,
      slug: DEMO_PROJECT_SLUG,
      description: DEMO_PROJECT_DESCRIPTION,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

async function ensureDemoAuthUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to create the demo login."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let authUser = null;
  let page = 1;

  while (!authUser) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    authUser = data.users.find(
      (user) => user.email?.toLowerCase() === DEMO_USER_EMAIL
    );

    if (authUser || data.users.length < 1000) {
      break;
    }

    page += 1;
  }

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: "Demo User",
        full_name: "Demo User",
      },
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: DEMO_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...authUser.user_metadata,
        name: "Demo User",
        full_name: "Demo User",
      },
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
  }

  const existingDatabaseUser = await prisma.user.findUnique({
    where: {
      email: DEMO_USER_EMAIL,
    },
    select: {
      id: true,
    },
  });

  if (existingDatabaseUser && existingDatabaseUser.id !== authUser.id) {
    throw new Error(
      `The Prisma demo user ID does not match the Supabase Auth user ID. Remove only the stale "${DEMO_USER_EMAIL}" demo records before seeding again.`
    );
  }

  return prisma.user.upsert({
    where: {
      email: DEMO_USER_EMAIL,
    },
    update: {
      name: "Demo User",
    },
    create: {
      id: authUser.id,
      email: DEMO_USER_EMAIL,
      name: "Demo User",
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

async function ensureDemoTeamMembers(workspaceId: string) {
  const members = [];

  for (const member of DEMO_TEAM_MEMBERS) {
    const user = await prisma.user.upsert({
      where: {
        email: member.email,
      },
      update: {
        name: member.name,
      },
      create: {
        email: member.email,
        name: member.name,
      },
      select: {
        id: true,
      },
    });

    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
      update: {
        role: member.role,
      },
      create: {
        userId: user.id,
        workspaceId,
        role: member.role,
      },
    });

    members.push(user);
  }

  return members;
}

async function removeObsoleteDemoTickets(projectId: string, demoTicketCodes: string[]) {
  const existingDemoTickets = await prisma.ticket.findMany({
    where: {
      projectId,
      code: {
        startsWith: DEMO_TICKET_CODE_PREFIX,
      },
    },
    select: {
      code: true,
    },
  });

  const obsoleteCodes = getObsoleteDemoTicketCodes(
    existingDemoTickets.map((ticket) => ticket.code),
    demoTicketCodes
  );

  if (obsoleteCodes.length === 0) {
    return;
  }

  await prisma.ticket.deleteMany({
    where: {
      projectId,
      code: {
        in: obsoleteCodes,
      },
    },
  });
}

async function removeLegacyDemoTickets(demoTicketCodes: string[]) {
  await prisma.ticket.deleteMany({
    where: {
      code: {
        in: demoTicketCodes,
      },
      workspace: {
        slug: LEGACY_DEMO_WORKSPACE_SLUG,
      },
    },
  });
}

async function ensureDemoTicketCodesAreSafe(input: {
  workspaceId: string;
  projectId: string;
  demoTicketCodes: string[];
}) {
  const conflictingTickets = await prisma.ticket.findMany({
    where: {
      code: {
        in: input.demoTicketCodes,
      },
      OR: [
        {
          workspaceId: {
            not: input.workspaceId,
          },
        },
        {
          projectId: {
            not: input.projectId,
          },
        },
      ],
    },
    select: {
      code: true,
      workspaceId: true,
      projectId: true,
    },
  });

  if (conflictingTickets.length > 0) {
    const conflictSummary = conflictingTickets
      .map(
        (ticket) =>
          `${ticket.code} (workspace=${ticket.workspaceId}, project=${ticket.projectId})`
      )
      .join(", ");

    throw new Error(
      `Demo seed codes already exist outside the demo workspace/project: ${conflictSummary}`
    );
  }
}

function upsertDemoTicket(input: {
  userId: string;
  assigneeId: string;
  workspaceId: string;
  projectId: string;
  ticket: DemoTicketSeed;
}) {
  const { userId, assigneeId, workspaceId, projectId, ticket } = input;

  return prisma.ticket.upsert({
    where: {
      code: ticket.code,
    },
    update: {
      workspaceId,
      projectId,
      reporterId: userId,
      assigneeId,
      title: ticket.title,
      description: ticket.description,
      expectedBehavior: ticket.expectedBehavior,
      actualBehavior: ticket.actualBehavior,
      stepsToReproduce: ticket.stepsToReproduce,
      browser: ticket.browser,
      device: ticket.device,
      environment: ticket.environment,
      affectedPage: ticket.affectedPage,
      severity: ticket.severity,
      status: ticket.status,
      category: ticket.category,
      priorityScore: ticket.priorityScore,
      aiConfidence: ticket.aiConfidence,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      aiAnalysis: {
        upsert: {
          update: {
            summary: ticket.aiSummary,
            likelyCause: ticket.likelyCause,
            suggestedFix: ticket.suggestedFix,
            reproductionSteps: ticket.reproductionSteps,
            tags: ticket.tags,
            confidenceScore: ticket.aiConfidence,
            rawAiResponse: {
              source: "demo-seed",
              confidenceScore: ticket.aiConfidence,
              category: ticket.category,
              severity: ticket.severity,
            },
            updatedAt: ticket.updatedAt,
          },
          create: {
            summary: ticket.aiSummary,
            likelyCause: ticket.likelyCause,
            suggestedFix: ticket.suggestedFix,
            reproductionSteps: ticket.reproductionSteps,
            tags: ticket.tags,
            confidenceScore: ticket.aiConfidence,
            rawAiResponse: {
              source: "demo-seed",
              confidenceScore: ticket.aiConfidence,
              category: ticket.category,
              severity: ticket.severity,
            },
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
          },
        },
      },
      aiAnalysisRuns: {
        deleteMany: {},
        create: {
          summary: ticket.aiSummary,
          severity: ticket.severity,
          category: ticket.category,
          priorityScore: ticket.priorityScore,
          confidenceScore: ticket.aiConfidence,
          tags: ticket.tags,
          likelyCause: ticket.likelyCause,
          suggestedFix: ticket.suggestedFix,
          reproductionSteps: ticket.reproductionSteps,
          rawAiResponse: {
            source: "demo-seed",
            confidenceScore: ticket.aiConfidence,
            category: ticket.category,
            severity: ticket.severity,
          },
          createdAt: ticket.createdAt,
        },
      },
      attachments: {
        deleteMany: {},
      },
      comments: {
        deleteMany: {},
        create: ticket.comments.map((comment) => ({
          authorId: userId,
          body: comment.body,
          createdAt: comment.createdAt,
          updatedAt: comment.createdAt,
        })),
      },
      activities: {
        deleteMany: {},
        create: ticket.activities.map((activity) => ({
          actorId: userId,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
        })),
      },
    },
    create: {
      code: ticket.code,
      workspaceId,
      projectId,
      reporterId: userId,
      assigneeId,
      title: ticket.title,
      description: ticket.description,
      expectedBehavior: ticket.expectedBehavior,
      actualBehavior: ticket.actualBehavior,
      stepsToReproduce: ticket.stepsToReproduce,
      browser: ticket.browser,
      device: ticket.device,
      environment: ticket.environment,
      affectedPage: ticket.affectedPage,
      severity: ticket.severity,
      status: ticket.status,
      category: ticket.category,
      priorityScore: ticket.priorityScore,
      aiConfidence: ticket.aiConfidence,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      aiAnalysis: {
        create: {
          summary: ticket.aiSummary,
          likelyCause: ticket.likelyCause,
          suggestedFix: ticket.suggestedFix,
          reproductionSteps: ticket.reproductionSteps,
          tags: ticket.tags,
          confidenceScore: ticket.aiConfidence,
          rawAiResponse: {
            source: "demo-seed",
            confidenceScore: ticket.aiConfidence,
            category: ticket.category,
            severity: ticket.severity,
          },
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        },
      },
      aiAnalysisRuns: {
        create: {
          summary: ticket.aiSummary,
          severity: ticket.severity,
          category: ticket.category,
          priorityScore: ticket.priorityScore,
          confidenceScore: ticket.aiConfidence,
          tags: ticket.tags,
          likelyCause: ticket.likelyCause,
          suggestedFix: ticket.suggestedFix,
          reproductionSteps: ticket.reproductionSteps,
          rawAiResponse: {
            source: "demo-seed",
            confidenceScore: ticket.aiConfidence,
            category: ticket.category,
            severity: ticket.severity,
          },
          createdAt: ticket.createdAt,
        },
      },
      comments: {
        create: ticket.comments.map((comment) => ({
          authorId: userId,
          body: comment.body,
          createdAt: comment.createdAt,
          updatedAt: comment.createdAt,
        })),
      },
      activities: {
        create: ticket.activities.map((activity) => ({
          actorId: userId,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
        })),
      },
    },
  });
}

export async function runDemoSeed() {
  const demoUser = await ensureDemoAuthUser();

  const workspace = await ensureDemoWorkspace(demoUser);
  const project = await ensureDemoProject(workspace.id);
  const teamMembers = await ensureDemoTeamMembers(workspace.id);
  const demoTickets = buildDemoTickets();
  const demoTicketCodes = demoTickets.map((ticket) => ticket.code);

  await removeLegacyDemoTickets(demoTicketCodes);

  await ensureDemoTicketCodesAreSafe({
    workspaceId: workspace.id,
    projectId: project.id,
    demoTicketCodes,
  });

  await removeObsoleteDemoTickets(project.id, demoTicketCodes);

  const seededTickets = await prisma.$transaction(
    demoTickets.map((ticket, index) =>
      upsertDemoTicket({
        userId: demoUser.id,
        assigneeId: teamMembers[index % teamMembers.length]?.id ?? demoUser.id,
        workspaceId: workspace.id,
        projectId: project.id,
        ticket,
      })
    )
  );

  const { backfillTicketEmbeddings } = await import(
    "../src/workers/ticket-embedding-backfill"
  );
  const embeddingBackfill = await backfillTicketEmbeddings({
    ticketIds: seededTickets.map((ticket) => ticket.id),
  });

  if (embeddingBackfill.failed > 0) {
    throw new Error(
      `Could not create ${embeddingBackfill.failed} demo ticket embeddings.`
    );
  }

  console.info(
    `Seeded ${demoTickets.length} demo tickets with ${embeddingBackfill.stored} refreshed and ${embeddingBackfill.skipped} current embeddings into "${workspace.name}" / "${project.name}" for ${demoUser.email}.`
  );
}

const executedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const currentFilePath = fileURLToPath(import.meta.url);

if (executedScriptPath === currentFilePath) {
  runDemoSeed()
    .catch((error) => {
      console.error("Demo seed failed.");
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
