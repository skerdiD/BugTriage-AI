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