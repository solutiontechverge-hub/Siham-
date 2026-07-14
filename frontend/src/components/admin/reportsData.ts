export type ReportUserType = "Client" | "Professional";
export type ReportStatus = "new" | "viewed";

export type ReportUser = {
  name: string;
  email: string;
  phone: string;
  initials: string;
  type: ReportUserType;
};

export type ReportRow = {
  id: string;
  reportId: string;
  reporter: ReportUser;
  reported: ReportUser;
  reasonCategory: string;
  reasonDescription: string;
  additionalDetails: string;
  date: string;
  time: string;
  status: ReportStatus;
};

export const reportSummaryStats = {
  new: 28,
  viewed: 42,
  total: 70,
  resolvedDeleted: 156,
};

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "viewed", label: "Viewed" },
];

export const REPORT_TYPE_OPTIONS = [
  { value: "all", label: "All Report Types" },
  { value: "Inappropriate behavior", label: "Inappropriate behavior" },
  { value: "No-show for appointment", label: "No-show for appointment" },
  { value: "Harassment", label: "Harassment" },
  { value: "Spam or fake profile", label: "Spam or fake profile" },
  { value: "Payment dispute", label: "Payment dispute" },
];

const REASONS = [
  {
    category: "Inappropriate behavior",
    description: "Unprofessional conduct during appointment",
    details:
      "The professional was rude and used inappropriate language during the session. I felt very uncomfortable and would like this reported.",
  },
  {
    category: "No-show for appointment",
    description: "Client did not attend scheduled booking",
    details:
      "The client booked an appointment but did not show up and did not respond to follow-up messages about rescheduling.",
  },
  {
    category: "Harassment",
    description: "Repeated unwanted contact after service",
    details:
      "After the appointment, the user continued sending unwanted messages through the platform despite being asked to stop.",
  },
  {
    category: "Spam or fake profile",
    description: "Suspected fraudulent or misleading profile",
    details:
      "The profile appears to use stock images and the listed services do not match what was offered during communication.",
  },
  {
    category: "Payment dispute",
    description: "Issue with charged amount or refund",
    details:
      "I was charged for a service that was not fully delivered. I have attempted to resolve this directly but received no response.",
  },
];

const REPORTER_CLIENTS: ReportUser[] = [
  {
    name: "Emma de Vries",
    email: "emma.devries@email.nl",
    phone: "+31 6 1234 5678",
    initials: "ED",
    type: "Client",
  },
  {
    name: "Marcus Weber",
    email: "marcus.weber@email.nl",
    phone: "+31 6 8765 4321",
    initials: "MW",
    type: "Client",
  },
  {
    name: "Sofia Rodriguez",
    email: "sofia.r@email.nl",
    phone: "+31 6 2345 6789",
    initials: "SR",
    type: "Client",
  },
];

const REPORTED_PROFESSIONALS: ReportUser[] = [
  {
    name: "Urban Cuts",
    email: "contact@urbancuts.nl",
    phone: "+31 6 11223344",
    initials: "UC",
    type: "Professional",
  },
  {
    name: "Glamour Studio",
    email: "info@glamourstudio.nl",
    phone: "+31 20 987 6543",
    initials: "GS",
    type: "Professional",
  },
  {
    name: "Beauty by Sarah",
    email: "sarah@sarahbeauty.nl",
    phone: "+31 6 55443322",
    initials: "BS",
    type: "Professional",
  },
];

const REPORTER_PROFESSIONALS: ReportUser[] = [
  {
    name: "Sarah Beauty",
    email: "sarah@sarahbeauty.nl",
    phone: "+31 6 12345678",
    initials: "SB",
    type: "Professional",
  },
  {
    name: "Glow Studio",
    email: "info@glowstudio.nl",
    phone: "+31 6 87654321",
    initials: "GS",
    type: "Professional",
  },
];

const REPORTED_CLIENTS: ReportUser[] = [
  {
    name: "Lisa Jansen",
    email: "lisa.j@email.nl",
    phone: "+31 6 55443322",
    initials: "LJ",
    type: "Client",
  },
  {
    name: "James O'Connor",
    email: "james.oconnor@email.nl",
    phone: "+31 6 3456 7890",
    initials: "JO",
    type: "Client",
  },
];

function generateReports(): ReportRow[] {
  const rows: ReportRow[] = [];
  for (let i = 0; i < 70; i += 1) {
    const reason = REASONS[i % REASONS.length];
    const clientReportsPro = i % 3 !== 1;
    const reporter = clientReportsPro
      ? REPORTER_CLIENTS[i % REPORTER_CLIENTS.length]
      : REPORTER_PROFESSIONALS[i % REPORTER_PROFESSIONALS.length];
    const reported = clientReportsPro
      ? REPORTED_PROFESSIONALS[i % REPORTED_PROFESSIONALS.length]
      : REPORTED_CLIENTS[i % REPORTED_CLIENTS.length];
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 28) + 1).padStart(2, "0");

    rows.push({
      id: `rep-${i + 1}`,
      reportId: `RPT-2025-${String(i + 1).padStart(5, "0")}`,
      reporter,
      reported,
      reasonCategory: reason.category,
      reasonDescription: reason.description,
      additionalDetails: reason.details,
      date: `2025-${month}-${day}`,
      time: `${String(9 + (i % 8)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      status: i % 3 === 0 ? "viewed" : "new",
    });
  }
  return rows;
}

export const mockReportRows = generateReports();
