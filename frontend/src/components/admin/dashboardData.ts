export const ADMIN_QUICK_LINKS = [
  {
    title: "Google Search Console",
    href: "https://search.google.com/search-console",
    logoLabel: "G",
    logoBg: "#E8F0FE",
    logoColor: "#4285F4",
  },
  {
    title: "Google Analytics",
    href: "https://analytics.google.com/",
    logoLabel: "GA",
    logoBg: "#FEF7E8",
    logoColor: "#E37400",
  },
] as const;

export const dashboardBookingsTrend = [
  { date: "May 15", online: 720, offline: 480 },
  { date: "May 16", online: 810, offline: 520 },
  { date: "May 17", online: 760, offline: 490 },
  { date: "May 18", online: 920, offline: 610 },
  { date: "May 19", online: 880, offline: 580 },
  { date: "May 20", online: 950, offline: 620 },
  { date: "May 21", online: 1020, offline: 650 },
];

export const dashboardTopProfessionals = [
  { id: "1", name: "Glamour Studio", city: "Amsterdam", province: "North Holland", bookings: 128 },
  { id: "2", name: "Beauty by Sarah", city: "Rotterdam", province: "South Holland", bookings: 96 },
  { id: "3", name: "Luxe Hair & Spa", city: "Utrecht", province: "Utrecht", bookings: 71 },
  { id: "4", name: "Glow Up Salon", city: "Eindhoven", province: "North Brabant", bookings: 63 },
  { id: "5", name: "The Hair Project", city: "The Hague", province: "South Holland", bookings: 58 },
];

export const dashboardRecentActivity = [
  {
    id: "da1",
    admin: "Admin User",
    action: "Validated professional",
    detail: "Sarah Beauty",
    timestamp: "May 21, 2025 · 09:21 AM",
    color: "teal" as const,
  },
  {
    id: "da2",
    admin: "dev01@molur.com",
    action: "Deleted review",
    detail: "Review ID #829",
    timestamp: "May 21, 2025 · 09:45 AM",
    color: "navy" as const,
  },
  {
    id: "da3",
    admin: "Admin User",
    action: "Disabled account",
    detail: "Client ID #221",
    timestamp: "May 21, 2025 · 10:02 AM",
    color: "warning" as const,
  },
  {
    id: "da4",
    admin: "dev02@molur.com",
    action: "Edited content",
    detail: "Updated NL homepage hero text",
    timestamp: "May 21, 2025 · 11:05 AM",
    color: "mint" as const,
  },
];

export const dashboardSummaryOverview = [
  {
    label: "Total Professionals",
    value: "1,365",
    breakdown: "FL: 856 · DL (Normal): 412 · DL (Project): 97",
  },
  {
    label: "Total Online Bookings",
    value: "7,842",
    breakdown: "FL: 4,235 · DL (Normal): 2,890 · DL (Project): 717",
  },
  {
    label: "Total Offline Bookings",
    value: "5,231",
    breakdown: "FL: 2,915 · DL (Normal): 1,842 · DL (Project): 474",
  },
  {
    label: "Total Online Transactions",
    value: "€ 128,765",
    breakdown: "Direct: € 98,765 · Non-direct: € 30,000",
  },
  {
    label: "Total Offline Transactions",
    value: "€ 76,432",
    breakdown: "Direct: € 52,432 · Non-direct: € 24,000",
  },
];

export const dashboardSystemStatus = [
  { label: "Website", status: "Operational" },
  { label: "Database", status: "Operational" },
  { label: "Email Service", status: "Operational" },
  { label: "Stripe", status: "Operational" },
];

export const dashboardKpiMetrics = [
  { label: "New Professionals", value: 128, trend: 18.7, icon: "business" as const },
  { label: "New Clients", value: 245, trend: 23.9, icon: "people" as const },
  { label: "New Individual Clients (IC)", value: 178, trend: 20.4, icon: "person" as const },
  { label: "New Company Clients (BC)", value: 67, trend: 15.2, icon: "company" as const },
  { label: "Total Online Bookings", value: 1264, trend: 21.3, icon: "online" as const },
  { label: "Total Offline Bookings", value: 842, trend: 12.6, icon: "offline" as const },
];
