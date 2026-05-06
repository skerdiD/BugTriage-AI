export type DashboardStat = {
  icon: "bugs" | "critical" | "reports" | "fixed";
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative";
  accent: "blue" | "red" | "violet" | "green";
};

export type SeverityDistributionItem = {
  name: "Critical" | "High" | "Medium" | "Low";
  value: number;
  color: string;
};

export type TrendDataItem = {
  label: string;
  bugs: number;
};

export type RecentTicket = {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: string;
  time: string;
  assignee: string;
  confidence: number;
};

export type PriorityQueueItem = {
  id: string;
  title: string;
  severity: "Critical" | "High";
};

export type TicketSeverity = "Critical" | "High" | "Medium" | "Low";

export type TicketStatus =
  | "New"
  | "Investigating"
  | "In Progress"
  | "Fixed"
  | "Closed";

export type TicketAttachment = {
  id: string;
  type: "screenshot" | "console-log";
  name: string;
  size: string;
  format: string;
  uploadedAt: string;
  preview: string;
};

export type TicketComment = {
  id: string;
  author: string;
  role: string;
  initials: string;
  createdAt: string;
  body: string;
};

export type TicketActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
};

export type Ticket = {
  id: string;
  title: string;
  severity: TicketSeverity;
  status: TicketStatus;
  category: string;
  assignee: string;
  assigneeInitials: string;
  assigneeRole: string;
  createdAt: string;
  confidence: number;
  originalReport: string;
  aiSummary: string;
  reproductionSteps: string[];
  possibleRootCause: string;
  suggestedFix: string;
  priorityScore: number;
  tags: string[];
  attachments: TicketAttachment[];
  browser: string;
  device: string;
  environment: string;
  affectedPage: string;
  createdDate: string;
  updatedDate: string;
  comments: TicketComment[];
  activity: TicketActivity[];
};

export const dashboardStats: DashboardStat[] = [
  {
    icon: "bugs",
    value: "1,247",
    label: "Total Bugs",
    trend: "+12%",
    trendType: "positive",
    accent: "blue",
  },
  {
    icon: "critical",
    value: "23",
    label: "Critical Issues",
    trend: "-8%",
    trendType: "negative",
    accent: "red",
  },
  {
    icon: "reports",
    value: "47",
    label: "New Reports",
    trend: "+23%",
    trendType: "positive",
    accent: "violet",
  },
  {
    icon: "fixed",
    value: "89",
    label: "Fixed This Week",
    trend: "+15%",
    trendType: "positive",
    accent: "green",
  },
];

export const severityDistribution: SeverityDistributionItem[] = [
  {
    name: "Critical",
    value: 23,
    color: "#ef4444",
  },
  {
    name: "High",
    value: 84,
    color: "#f97316",
  },
  {
    name: "Medium",
    value: 192,
    color: "#eab308",
  },
  {
    name: "Low",
    value: 331,
    color: "#3b82f6",
  },
];

export const trendData: TrendDataItem[] = [
  {
    label: "Mon",
    bugs: 142,
  },
  {
    label: "Tue",
    bugs: 179,
  },
  {
    label: "Wed",
    bugs: 156,
  },
  {
    label: "Thu",
    bugs: 201,
  },
  {
    label: "Fri",
    bugs: 168,
  },
  {
    label: "Sat",
    bugs: 191,
  },
];

export const recentTickets: RecentTicket[] = [
  {
    id: "BUG-2847",
    title: "Payment form fails on Safari mobile",
    severity: "Critical",
    category: "Payment",
    time: "12 min ago",
    assignee: "Alex Rivera",
    confidence: 94,
  },
  {
    id: "BUG-2846",
    title: "Dashboard widgets not loading for users in EU region",
    severity: "High",
    category: "Performance",
    time: "1 hour ago",
    assignee: "Jordan Lee",
    confidence: 89,
  },
  {
    id: "BUG-2845",
    title: "Profile image upload shows incorrect file size error",
    severity: "Medium",
    category: "UI/UX",
    time: "3 hours ago",
    assignee: "Taylor Morgan",
    confidence: 92,
  },
  {
    id: "BUG-2844",
    title: "Email notifications delayed by 15+ minutes",
    severity: "High",
    category: "Backend",
    time: "5 hours ago",
    assignee: "Sam Chen",
    confidence: 87,
  },
];

export const highPriorityQueue: PriorityQueueItem[] = [
  {
    id: "BUG-2847",
    title: "Payment form fails",
    severity: "Critical",
  },
  {
    id: "BUG-2846",
    title: "Dashboard loading issue",
    severity: "High",
  },
  {
    id: "BUG-2844",
    title: "Email delays",
    severity: "High",
  },
];

export const tickets: Ticket[] = [
  {
    id: "BUG-2847",
    title: "Payment form fails on Safari mobile",
    severity: "Critical",
    status: "Investigating",
    category: "Payment",
    assignee: "Alex Rivera",
    assigneeInitials: "AR",
    assigneeRole: "Frontend Engineer",
    createdAt: "12 min ago",
    confidence: 94,
    originalReport:
      "A customer reported that checkout becomes unresponsive on Safari iOS after entering valid card details. The submit button remains disabled, and refreshing the page is the only way to try again. The issue happened twice during payment on production.",
    aiSummary:
      "Safari iOS users may be blocked from completing checkout because the payment form does not re-enable submission after valid card data is entered.",
    reproductionSteps: [
      "Open the checkout payment page on Safari iOS.",
      "Fill in shipping and billing details.",
      "Enter valid credit card information.",
      "Observe that the payment submit button remains disabled.",
      "Try refreshing and repeating the flow to reproduce the issue.",
    ],
    possibleRootCause:
      "The payment form may depend on an input validation event or payment intent response that behaves differently in Safari iOS, leaving the submit state locked in a disabled state.",
    suggestedFix:
      "Audit the payment form state machine, add defensive checks for payment intent creation, verify Safari input events, and ensure submit availability is recalculated after every card input change.",
    priorityScore: 96,
    tags: ["safari-ios", "checkout", "payment", "frontend", "revenue-impact"],
    attachments: [
      {
        id: "att-1",
        type: "screenshot",
        name: "safari-payment-disabled.png",
        size: "842 KB",
        format: "PNG",
        uploadedAt: "12 min ago",
        preview:
          "Screenshot shows the checkout payment form with completed card fields and a disabled submit button.",
      },
      {
        id: "att-2",
        type: "console-log",
        name: "payment-form-console.log",
        size: "18 KB",
        format: "LOG",
        uploadedAt: "11 min ago",
        preview:
          "TypeError: Cannot read properties of undefined reading paymentIntent at PaymentForm.submitPayment.",
      },
    ],
    browser: "Safari 17",
    device: "iPhone 15 Pro",
    environment: "Production",
    affectedPage: "/checkout/payment",
    createdDate: "May 6, 2026, 09:14",
    updatedDate: "May 6, 2026, 09:26",
    comments: [
      {
        id: "comment-1",
        author: "Alex Rivera",
        role: "Frontend Engineer",
        initials: "AR",
        createdAt: "8 min ago",
        body: "I will check the card input validation state and compare Safari iOS behavior against Chrome mobile.",
      },
      {
        id: "comment-2",
        author: "Sarah Chen",
        role: "Engineering Lead",
        initials: "SC",
        createdAt: "5 min ago",
        body: "High priority because this blocks revenue flow. Please verify whether this affects all Safari versions or only latest iOS.",
      },
    ],
    activity: [
      {
        id: "activity-1",
        title: "Bug submitted",
        description: "Raw report was submitted with screenshot and console log.",
        time: "12 min ago",
      },
      {
        id: "activity-2",
        title: "AI triage completed",
        description: "Severity set to Critical with 94% confidence.",
        time: "11 min ago",
      },
      {
        id: "activity-3",
        title: "Assigned to Alex Rivera",
        description: "AI recommended frontend ownership based on affected component.",
        time: "9 min ago",
      },
      {
        id: "activity-4",
        title: "Status changed",
        description: "Ticket moved from New to Investigating.",
        time: "7 min ago",
      },
    ],
  },
  {
    id: "BUG-2846",
    title: "Dashboard widgets not loading for users in EU region",
    severity: "High",
    status: "In Progress",
    category: "Performance",
    assignee: "Jordan Lee",
    assigneeInitials: "JL",
    assigneeRole: "Backend Engineer",
    createdAt: "1 hour ago",
    confidence: 89,
    originalReport:
      "Several EU users reported that analytics dashboard widgets stay in a loading state. The sidebar and shell load correctly, but revenue, traffic, and issue trend cards do not render.",
    aiSummary:
      "Dashboard data widgets appear to stall for EU users, likely because regional API responses are timing out or returning incomplete payloads.",
    reproductionSteps: [
      "Open the dashboard from an EU-based network.",
      "Wait for analytics cards to load.",
      "Observe that the main app shell loads but widgets remain in loading state.",
      "Open network tab and inspect analytics API calls.",
    ],
    possibleRootCause:
      "Regional latency or an API timeout may cause dashboard data fetching to fail silently before the UI receives a complete payload.",
    suggestedFix:
      "Add timeout handling, inspect regional API logs, improve loading fallback states, and verify database region performance for analytics queries.",
    priorityScore: 88,
    tags: ["dashboard", "eu-region", "api-timeout", "performance"],
    attachments: [
      {
        id: "att-3",
        type: "screenshot",
        name: "dashboard-loading-state.png",
        size: "624 KB",
        format: "PNG",
        uploadedAt: "1 hour ago",
        preview:
          "Screenshot shows dashboard widgets stuck in skeleton loading state.",
      },
      {
        id: "att-4",
        type: "console-log",
        name: "analytics-network-log.json",
        size: "31 KB",
        format: "JSON",
        uploadedAt: "1 hour ago",
        preview:
          "Analytics endpoint returned delayed response with missing payload fields.",
      },
    ],
    browser: "Chrome 124",
    device: "Desktop",
    environment: "Production",
    affectedPage: "/dashboard",
    createdDate: "May 6, 2026, 08:18",
    updatedDate: "May 6, 2026, 09:02",
    comments: [
      {
        id: "comment-3",
        author: "Jordan Lee",
        role: "Backend Engineer",
        initials: "JL",
        createdAt: "44 min ago",
        body: "Checking regional API logs and query timing for the dashboard analytics endpoint.",
      },
    ],
    activity: [
      {
        id: "activity-5",
        title: "Bug submitted",
        description: "Multiple support reports were grouped into one ticket.",
        time: "1 hour ago",
      },
      {
        id: "activity-6",
        title: "AI triage completed",
        description: "Severity set to High with 89% confidence.",
        time: "58 min ago",
      },
      {
        id: "activity-7",
        title: "Status changed",
        description: "Ticket moved to In Progress.",
        time: "42 min ago",
      },
    ],
  },
  {
    id: "BUG-2845",
    title: "Profile image upload shows incorrect file size error",
    severity: "Medium",
    status: "New",
    category: "UI/UX",
    assignee: "Taylor Morgan",
    assigneeInitials: "TM",
    assigneeRole: "Product Engineer",
    createdAt: "3 hours ago",
    confidence: 92,
    originalReport:
      "A user tried uploading a 1.2 MB JPG avatar, but the UI displayed a file size error saying the image exceeded 10 MB.",
    aiSummary:
      "The profile image upload UI is showing an incorrect size validation error for valid image files.",
    reproductionSteps: [
      "Open profile settings.",
      "Choose a valid JPG image below 10 MB.",
      "Upload the image.",
      "Observe incorrect file size validation error.",
    ],
    possibleRootCause:
      "The UI may be reading file size metadata incorrectly or applying validation before file normalization.",
    suggestedFix:
      "Review upload validation logic, confirm byte-to-megabyte conversion, and improve error messaging around file constraints.",
    priorityScore: 64,
    tags: ["upload", "profile", "validation", "ui"],
    attachments: [
      {
        id: "att-5",
        type: "screenshot",
        name: "profile-upload-error.png",
        size: "411 KB",
        format: "PNG",
        uploadedAt: "3 hours ago",
        preview:
          "Screenshot shows a size error for a JPG file that should be accepted.",
      },
      {
        id: "att-6",
        type: "console-log",
        name: "upload-console.log",
        size: "8 KB",
        format: "LOG",
        uploadedAt: "3 hours ago",
        preview:
          "Validation returned max-size error while file metadata reports 1.2 MB.",
      },
    ],
    browser: "Chrome 124",
    device: "Desktop",
    environment: "Production",
    affectedPage: "/profile/settings",
    createdDate: "May 6, 2026, 06:31",
    updatedDate: "May 6, 2026, 06:34",
    comments: [
      {
        id: "comment-4",
        author: "Taylor Morgan",
        role: "Product Engineer",
        initials: "TM",
        createdAt: "2 hours ago",
        body: "Looks like a validation copy or unit conversion problem. I will inspect the upload helper.",
      },
    ],
    activity: [
      {
        id: "activity-8",
        title: "Bug submitted",
        description: "User reported incorrect image size validation.",
        time: "3 hours ago",
      },
      {
        id: "activity-9",
        title: "AI triage completed",
        description: "Severity set to Medium with 92% confidence.",
        time: "3 hours ago",
      },
    ],
  },
  {
    id: "BUG-2844",
    title: "Email notifications delayed by 15+ minutes",
    severity: "High",
    status: "In Progress",
    category: "Backend",
    assignee: "Sam Chen",
    assigneeInitials: "SC",
    assigneeRole: "Platform Engineer",
    createdAt: "5 hours ago",
    confidence: 87,
    originalReport:
      "Users receive notification emails 15 to 25 minutes after the triggering event. This affects invites, comments, and critical alert emails.",
    aiSummary:
      "Email notification delivery is delayed across multiple event types, suggesting queue processing or provider latency issues.",
    reproductionSteps: [
      "Trigger a workspace invite.",
      "Add a comment to an active ticket.",
      "Trigger a critical alert event.",
      "Compare event timestamp with received email timestamp.",
    ],
    possibleRootCause:
      "The notification queue may be backed up, retrying failed jobs, or waiting on slow email provider responses.",
    suggestedFix:
      "Inspect queue worker throughput, provider response times, retry logic, and alert delivery priority.",
    priorityScore: 84,
    tags: ["email", "notifications", "queue", "backend"],
    attachments: [
      {
        id: "att-7",
        type: "screenshot",
        name: "email-delay-timestamps.png",
        size: "522 KB",
        format: "PNG",
        uploadedAt: "5 hours ago",
        preview:
          "Screenshot compares app event timestamp with delayed email received time.",
      },
      {
        id: "att-8",
        type: "console-log",
        name: "notification-worker.log",
        size: "44 KB",
        format: "LOG",
        uploadedAt: "5 hours ago",
        preview:
          "Worker log shows queue retries and delayed processing for notification jobs.",
      },
    ],
    browser: "Edge 123",
    device: "Desktop",
    environment: "Production",
    affectedPage: "notification-worker",
    createdDate: "May 6, 2026, 04:12",
    updatedDate: "May 6, 2026, 08:48",
    comments: [
      {
        id: "comment-5",
        author: "Sam Chen",
        role: "Platform Engineer",
        initials: "SC",
        createdAt: "3 hours ago",
        body: "Queue depth looks higher than expected. Investigating worker scaling and provider retry behavior.",
      },
    ],
    activity: [
      {
        id: "activity-10",
        title: "Bug submitted",
        description: "Support escalated delayed notification emails.",
        time: "5 hours ago",
      },
      {
        id: "activity-11",
        title: "AI triage completed",
        description: "Severity set to High with 87% confidence.",
        time: "5 hours ago",
      },
      {
        id: "activity-12",
        title: "Status changed",
        description: "Ticket moved to In Progress.",
        time: "3 hours ago",
      },
    ],
  },
  {
    id: "BUG-2843",
    title: "Search autocomplete returns outdated results",
    severity: "Medium",
    status: "New",
    category: "Search",
    assignee: "Casey Kim",
    assigneeInitials: "CK",
    assigneeRole: "Full-Stack Engineer",
    createdAt: "1 day ago",
    confidence: 85,
    originalReport:
      "Search autocomplete sometimes displays old project names after they have been renamed in settings.",
    aiSummary:
      "Autocomplete results may be served from stale cache after project metadata updates.",
    reproductionSteps: [
      "Rename a project in workspace settings.",
      "Open global search.",
      "Type the old project name.",
      "Observe that outdated results still appear.",
    ],
    possibleRootCause:
      "Search index cache may not invalidate after project metadata changes.",
    suggestedFix:
      "Invalidate autocomplete cache on project rename and refresh indexed project labels.",
    priorityScore: 58,
    tags: ["search", "cache", "autocomplete"],
    attachments: [
      {
        id: "att-9",
        type: "screenshot",
        name: "old-search-result.png",
        size: "382 KB",
        format: "PNG",
        uploadedAt: "1 day ago",
        preview:
          "Screenshot shows old project name appearing in autocomplete results.",
      },
      {
        id: "att-10",
        type: "console-log",
        name: "search-cache-response.json",
        size: "12 KB",
        format: "JSON",
        uploadedAt: "1 day ago",
        preview:
          "Search response includes old project label from cached index payload.",
      },
    ],
    browser: "Chrome 124",
    device: "Desktop",
    environment: "Production",
    affectedPage: "/search",
    createdDate: "May 5, 2026, 10:22",
    updatedDate: "May 5, 2026, 10:25",
    comments: [
      {
        id: "comment-6",
        author: "Casey Kim",
        role: "Full-Stack Engineer",
        initials: "CK",
        createdAt: "21 hours ago",
        body: "Likely cache invalidation. I will test project rename events against search indexing.",
      },
    ],
    activity: [
      {
        id: "activity-13",
        title: "Bug submitted",
        description: "Outdated autocomplete result reported.",
        time: "1 day ago",
      },
      {
        id: "activity-14",
        title: "AI triage completed",
        description: "Severity set to Medium with 85% confidence.",
        time: "1 day ago",
      },
    ],
  },
  {
    id: "BUG-2842",
    title: "CSV export includes hidden internal columns",
    severity: "Low",
    status: "Fixed",
    category: "Export",
    assignee: "Riley Park",
    assigneeInitials: "RP",
    assigneeRole: "Data Engineer",
    createdAt: "2 days ago",
    confidence: 91,
    originalReport:
      "CSV exports include hidden internal columns that should not be visible to customers.",
    aiSummary:
      "The CSV export mapping includes internal fields that should be removed from customer-facing exports.",
    reproductionSteps: [
      "Open analytics export.",
      "Export any report as CSV.",
      "Open exported file.",
      "Notice internal columns in the output.",
    ],
    possibleRootCause:
      "Export serialization may be using the database model directly instead of a customer-safe DTO.",
    suggestedFix:
      "Create an explicit export field allowlist and add a regression test for customer-safe CSV columns.",
    priorityScore: 42,
    tags: ["csv", "export", "privacy", "data"],
    attachments: [
      {
        id: "att-11",
        type: "screenshot",
        name: "csv-hidden-columns.png",
        size: "288 KB",
        format: "PNG",
        uploadedAt: "2 days ago",
        preview:
          "Screenshot shows internal identifiers visible in the exported CSV.",
      },
      {
        id: "att-12",
        type: "console-log",
        name: "export-payload.json",
        size: "19 KB",
        format: "JSON",
        uploadedAt: "2 days ago",
        preview:
          "Export payload includes internal database fields before serialization.",
      },
    ],
    browser: "Firefox 125",
    device: "Desktop",
    environment: "Production",
    affectedPage: "/analytics/export",
    createdDate: "May 4, 2026, 13:08",
    updatedDate: "May 5, 2026, 09:40",
    comments: [
      {
        id: "comment-7",
        author: "Riley Park",
        role: "Data Engineer",
        initials: "RP",
        createdAt: "1 day ago",
        body: "Fixed with an export allowlist and added coverage for internal fields.",
      },
    ],
    activity: [
      {
        id: "activity-15",
        title: "Bug submitted",
        description: "CSV export included internal columns.",
        time: "2 days ago",
      },
      {
        id: "activity-16",
        title: "AI triage completed",
        description: "Severity set to Low with 91% confidence.",
        time: "2 days ago",
      },
      {
        id: "activity-17",
        title: "Status changed",
        description: "Ticket moved to Fixed.",
        time: "1 day ago",
      },
    ],
  },
  {
    id: "BUG-2841",
    title: "Mobile navigation menu does not close after route change",
    severity: "Medium",
    status: "Investigating",
    category: "Navigation",
    assignee: "Morgan Ellis",
    assigneeInitials: "ME",
    assigneeRole: "Frontend Engineer",
    createdAt: "2 days ago",
    confidence: 88,
    originalReport:
      "On mobile, the navigation drawer remains open after selecting a route, covering the destination page until the user manually closes it.",
    aiSummary:
      "The mobile navigation drawer does not respond to route changes, causing the overlay to remain visible after navigation.",
    reproductionSteps: [
      "Open app on mobile viewport.",
      "Open navigation drawer.",
      "Select any route.",
      "Observe drawer remains open after page transition.",
    ],
    possibleRootCause:
      "The sheet state may not be reset when pathname changes.",
    suggestedFix:
      "Track pathname changes and close the mobile sheet after navigation.",
    priorityScore: 61,
    tags: ["mobile", "navigation", "ux", "sidebar"],
    attachments: [
      {
        id: "att-13",
        type: "screenshot",
        name: "mobile-nav-stuck.png",
        size: "359 KB",
        format: "PNG",
        uploadedAt: "2 days ago",
        preview:
          "Screenshot shows drawer overlay remaining open on destination route.",
      },
      {
        id: "att-14",
        type: "console-log",
        name: "mobile-nav-state.log",
        size: "6 KB",
        format: "LOG",
        uploadedAt: "2 days ago",
        preview:
          "Route changed but drawer open state remained true.",
      },
    ],
    browser: "Safari 17",
    device: "iPhone 14",
    environment: "Production",
    affectedPage: "AppSidebar / MobileSheet",
    createdDate: "May 4, 2026, 11:44",
    updatedDate: "May 4, 2026, 16:02",
    comments: [
      {
        id: "comment-8",
        author: "Morgan Ellis",
        role: "Frontend Engineer",
        initials: "ME",
        createdAt: "1 day ago",
        body: "Testing route-change close behavior for the mobile sheet.",
      },
    ],
    activity: [
      {
        id: "activity-18",
        title: "Bug submitted",
        description: "Mobile navigation overlay issue reported.",
        time: "2 days ago",
      },
      {
        id: "activity-19",
        title: "AI triage completed",
        description: "Severity set to Medium with 88% confidence.",
        time: "2 days ago",
      },
    ],
  },
  {
    id: "BUG-2840",
    title: "API rate limit headers missing from failed requests",
    severity: "Low",
    status: "Fixed",
    category: "API",
    assignee: "Jamie Foster",
    assigneeInitials: "JF",
    assigneeRole: "Backend Engineer",
    createdAt: "3 days ago",
    confidence: 93,
    originalReport:
      "Failed API requests do not include rate limit headers, making it harder for clients to understand retry behavior.",
    aiSummary:
      "Error responses are missing standard rate limit headers that are present on successful responses.",
    reproductionSteps: [
      "Send requests until rate limit is reached.",
      "Inspect successful response headers.",
      "Inspect failed response headers.",
      "Compare missing rate limit metadata.",
    ],
    possibleRootCause:
      "Error middleware may return before the rate limit header middleware attaches metadata.",
    suggestedFix:
      "Attach rate limit headers in a shared response layer that runs for both success and error paths.",
    priorityScore: 38,
    tags: ["api", "headers", "rate-limit"],
    attachments: [
      {
        id: "att-15",
        type: "screenshot",
        name: "missing-rate-limit-headers.png",
        size: "245 KB",
        format: "PNG",
        uploadedAt: "3 days ago",
        preview:
          "Screenshot shows failed response missing rate limit header metadata.",
      },
      {
        id: "att-16",
        type: "console-log",
        name: "api-response-headers.json",
        size: "10 KB",
        format: "JSON",
        uploadedAt: "3 days ago",
        preview:
          "Header comparison between successful and failed API responses.",
      },
    ],
    browser: "Chrome 124",
    device: "Desktop",
    environment: "Production",
    affectedPage: "/api/v1/*",
    createdDate: "May 3, 2026, 15:19",
    updatedDate: "May 4, 2026, 10:15",
    comments: [
      {
        id: "comment-9",
        author: "Jamie Foster",
        role: "Backend Engineer",
        initials: "JF",
        createdAt: "2 days ago",
        body: "Fixed by moving rate limit headers into shared response middleware.",
      },
    ],
    activity: [
      {
        id: "activity-20",
        title: "Bug submitted",
        description: "Missing headers reported by API consumer.",
        time: "3 days ago",
      },
      {
        id: "activity-21",
        title: "AI triage completed",
        description: "Severity set to Low with 93% confidence.",
        time: "3 days ago",
      },
      {
        id: "activity-22",
        title: "Status changed",
        description: "Ticket moved to Fixed.",
        time: "2 days ago",
      },
    ],
  },
  {
    id: "BUG-2839",
    title: "Team invite link expires before recipient opens email",
    severity: "Medium",
    status: "New",
    category: "Team",
    assignee: "Priya Shah",
    assigneeInitials: "PS",
    assigneeRole: "Product Engineer",
    createdAt: "4 days ago",
    confidence: 86,
    originalReport:
      "A new teammate opened an invitation email after about one hour and the invite link had already expired.",
    aiSummary:
      "Invite links may expire too aggressively or expiration handling may be using the wrong timestamp.",
    reproductionSteps: [
      "Create a new team invite.",
      "Wait around one hour.",
      "Open the invite email.",
      "Observe that invite is expired.",
    ],
    possibleRootCause:
      "Invite expiration may be calculated from creation time using a short TTL or server timezone mismatch.",
    suggestedFix:
      "Verify invite TTL configuration, timezone handling, and expiration copy shown to users.",
    priorityScore: 57,
    tags: ["team", "invite", "auth-flow"],
    attachments: [
      {
        id: "att-17",
        type: "screenshot",
        name: "expired-invite.png",
        size: "333 KB",
        format: "PNG",
        uploadedAt: "4 days ago",
        preview:
          "Screenshot shows invite expired page shortly after invitation was sent.",
      },
      {
        id: "att-18",
        type: "console-log",
        name: "invite-token-response.json",
        size: "7 KB",
        format: "JSON",
        uploadedAt: "4 days ago",
        preview:
          "Invite token response includes expiration timestamp earlier than expected.",
      },
    ],
    browser: "Chrome 124",
    device: "Desktop",
    environment: "Production",
    affectedPage: "/team/invite",
    createdDate: "May 2, 2026, 14:03",
    updatedDate: "May 2, 2026, 15:17",
    comments: [
      {
        id: "comment-10",
        author: "Priya Shah",
        role: "Product Engineer",
        initials: "PS",
        createdAt: "3 days ago",
        body: "I will check invite TTL and timezone handling in the invite flow.",
      },
    ],
    activity: [
      {
        id: "activity-23",
        title: "Bug submitted",
        description: "Invite expiration issue reported.",
        time: "4 days ago",
      },
      {
        id: "activity-24",
        title: "AI triage completed",
        description: "Severity set to Medium with 86% confidence.",
        time: "4 days ago",
      },
    ],
  },
  {
    id: "BUG-2838",
    title: "Analytics chart tooltip overlaps with sidebar on small screens",
    severity: "Low",
    status: "Fixed",
    category: "Analytics",
    assignee: "Nina Brooks",
    assigneeInitials: "NB",
    assigneeRole: "UI Engineer",
    createdAt: "5 days ago",
    confidence: 90,
    originalReport:
      "On smaller laptop screens, the analytics chart tooltip opens near the sidebar and overlaps with navigation content.",
    aiSummary:
      "Chart tooltip positioning can overlap the sidebar on constrained desktop widths.",
    reproductionSteps: [
      "Open analytics page on a small laptop width.",
      "Hover over the first chart bars.",
      "Move cursor near the left chart edge.",
      "Observe tooltip overlapping sidebar area.",
    ],
    possibleRootCause:
      "Tooltip positioning is not constrained within chart card bounds.",
    suggestedFix:
      "Constrain tooltip overflow, adjust chart padding, or customize tooltip placement for small screens.",
    priorityScore: 34,
    tags: ["analytics", "tooltip", "responsive-ui"],
    attachments: [
      {
        id: "att-19",
        type: "screenshot",
        name: "tooltip-overlap.png",
        size: "298 KB",
        format: "PNG",
        uploadedAt: "5 days ago",
        preview:
          "Screenshot shows tooltip overlapping the navigation/sidebar area.",
      },
      {
        id: "att-20",
        type: "console-log",
        name: "chart-layout-debug.log",
        size: "5 KB",
        format: "LOG",
        uploadedAt: "5 days ago",
        preview:
          "Chart width and tooltip position debug values captured during hover.",
      },
    ],
    browser: "Chrome 124",
    device: "Small laptop",
    environment: "Production",
    affectedPage: "/analytics",
    createdDate: "May 1, 2026, 17:32",
    updatedDate: "May 2, 2026, 12:09",
    comments: [
      {
        id: "comment-11",
        author: "Nina Brooks",
        role: "UI Engineer",
        initials: "NB",
        createdAt: "4 days ago",
        body: "Fixed tooltip boundaries and added more chart padding on small screens.",
      },
    ],
    activity: [
      {
        id: "activity-25",
        title: "Bug submitted",
        description: "Analytics tooltip overlap reported.",
        time: "5 days ago",
      },
      {
        id: "activity-26",
        title: "AI triage completed",
        description: "Severity set to Low with 90% confidence.",
        time: "5 days ago",
      },
      {
        id: "activity-27",
        title: "Status changed",
        description: "Ticket moved to Fixed.",
        time: "4 days ago",
      },
    ],
  },
];