export type ActivityLogAction =
  | "created"
  | "updated"
  | "logged_in"
  | "deleted"
  | "system"
  | "changed_status"
  | "logged_out";

export type ActivityLogModule =
  | "professional"
  | "client"
  | "authentication"
  | "review"
  | "listing"
  | "system"
  | "booking"
  | "email"
  | "report";

export type ActivityLogUser = {
  name: string;
  email: string;
  initials: string;
};

export type ActivityLogRow = {
  id: string;
  date: string;
  time: string;
  user: ActivityLogUser;
  action: ActivityLogAction;
  actionLabel: string;
  module: ActivityLogModule;
  moduleLabel: string;
  details: string;
  ipAddress: string;
};

export const activityLogSummaryStats = {
  total: 12845,
  today: 245,
  thisWeek: 1562,
  thisMonth: 5876,
};

export const USER_FILTER_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "admin@mollure.com", label: "Admin User" },
  { value: "dev01@molur.com", label: "Dev Support" },
  { value: "dev02@molur.com", label: "Dev Support 2" },
  { value: "sarah.admin@mollure.com", label: "Sarah Admin" },
];

export const ACTION_FILTER_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "logged_in", label: "Logged In" },
  { value: "deleted", label: "Deleted" },
  { value: "system", label: "System" },
  { value: "changed_status", label: "Changed Status" },
  { value: "logged_out", label: "Logged Out" },
];

export const MODULE_FILTER_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "professional", label: "Professional" },
  { value: "client", label: "Client" },
  { value: "authentication", label: "Authentication" },
  { value: "review", label: "Review" },
  { value: "listing", label: "Listing" },
  { value: "system", label: "System" },
  { value: "booking", label: "Booking" },
  { value: "email", label: "Email" },
  { value: "report", label: "Report" },
];

export const ACTION_STYLES: Record<ActivityLogAction, { bg: string; color: string; label: string }> = {
  created: { bg: "rgba(76, 175, 80, 0.12)", color: "#2E7D32", label: "Created" },
  updated: { bg: "rgba(59, 130, 246, 0.12)", color: "#2563EB", label: "Updated" },
  logged_in: { bg: "rgba(76, 175, 80, 0.08)", color: "#388E3C", label: "Logged In" },
  deleted: { bg: "rgba(217, 45, 32, 0.12)", color: "#D92D20", label: "Deleted" },
  system: { bg: "rgba(127, 86, 217, 0.12)", color: "#6941C6", label: "System" },
  changed_status: { bg: "rgba(220, 104, 3, 0.14)", color: "#DC6803", label: "Changed Status" },
  logged_out: { bg: "rgba(107, 114, 128, 0.12)", color: "#6B7280", label: "Logged Out" },
};

export const activitySummaryCounts = [
  { action: "created" as const, count: 3240 },
  { action: "updated" as const, count: 4180 },
  { action: "deleted" as const, count: 890 },
  { action: "logged_in" as const, count: 2150 },
  { action: "changed_status" as const, count: 1420 },
  { action: "system" as const, count: 965 },
];

export const topActivityUsers = [
  { id: "u1", name: "Admin User", email: "admin@mollure.com", initials: "AU", count: 1842 },
  { id: "u2", name: "Sarah Admin", email: "sarah.admin@mollure.com", initials: "SA", count: 1265 },
  { id: "u3", name: "Dev Support", email: "dev01@molur.com", initials: "DS", count: 984 },
  { id: "u4", name: "Dev Support 2", email: "dev02@molur.com", initials: "D2", count: 712 },
];

export const recentActivityAlerts = [
  {
    id: "al1",
    title: "Failed login attempt",
    description: "3 failed attempts from IP 192.168.1.45",
    time: "2 min ago",
    severity: "error" as const,
  },
  {
    id: "al2",
    title: "Suspicious activity detected",
    description: "Unusual bulk delete pattern flagged",
    time: "18 min ago",
    severity: "warning" as const,
  },
  {
    id: "al3",
    title: "System backup completed",
    description: "Daily backup finished successfully",
    time: "1 hr ago",
    severity: "info" as const,
  },
];

const USERS: ActivityLogUser[] = [
  { name: "Admin User", email: "admin@mollure.com", initials: "AU" },
  { name: "Dev Support", email: "dev01@molur.com", initials: "DS" },
  { name: "Sarah Admin", email: "sarah.admin@mollure.com", initials: "SA" },
  { name: "Dev Support 2", email: "dev02@molur.com", initials: "D2" },
];

const ENTRIES: Omit<ActivityLogRow, "id" | "date" | "time" | "ipAddress">[] = [
  {
    user: USERS[0],
    action: "created",
    actionLabel: "Created",
    module: "professional",
    moduleLabel: "Professional",
    details: "New professional account created for Glamour Studio",
  },
  {
    user: USERS[1],
    action: "updated",
    actionLabel: "Updated",
    module: "client",
    moduleLabel: "Client",
    details: "Updated client profile for Emma Thompson",
  },
  {
    user: USERS[0],
    action: "logged_in",
    actionLabel: "Logged In",
    module: "authentication",
    moduleLabel: "Authentication",
    details: "Admin user logged in successfully",
  },
  {
    user: USERS[2],
    action: "deleted",
    actionLabel: "Deleted",
    module: "review",
    moduleLabel: "Review",
    details: "Removed flagged review #829 from public listing",
  },
  {
    user: USERS[3],
    action: "system",
    actionLabel: "System",
    module: "system",
    moduleLabel: "System",
    details: "Automated daily backup completed successfully",
  },
  {
    user: USERS[0],
    action: "updated",
    actionLabel: "Updated",
    module: "listing",
    moduleLabel: "Listing",
    details: "Updated listing ranking weights for featured professionals",
  },
  {
    user: USERS[1],
    action: "created",
    actionLabel: "Created",
    module: "email",
    moduleLabel: "Email",
    details: "Sent welcome email to new client registration",
  },
  {
    user: USERS[1],
    action: "changed_status",
    actionLabel: "Changed Status",
    module: "booking",
    moduleLabel: "Booking",
    details: "Booking #4521 status changed from pending to confirmed",
  },
  {
    user: USERS[0],
    action: "logged_out",
    actionLabel: "Logged Out",
    module: "authentication",
    moduleLabel: "Authentication",
    details: "Admin user logged out",
  },
  {
    user: USERS[2],
    action: "updated",
    actionLabel: "Updated",
    module: "professional",
    moduleLabel: "Professional",
    details: "Updated ranking weights for listing module",
  },
];

function generateActivityLogs(): ActivityLogRow[] {
  const rows: ActivityLogRow[] = [];
  for (let i = 0; i < 80; i += 1) {
    const entry = ENTRIES[i % ENTRIES.length];
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 28) + 1).padStart(2, "0");
    rows.push({
      id: `log-${i + 1}`,
      date: `2025-${month}-${day}`,
      time: `${String(8 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      ipAddress: `192.168.${(i % 5) + 1}.${(i % 200) + 10}`,
      ...entry,
      user: USERS[i % USERS.length],
    });
  }
  return rows;
}

export const mockActivityLogRows = generateActivityLogs();
