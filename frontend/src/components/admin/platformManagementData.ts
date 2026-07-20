import { ADMIN_QUICK_LINKS } from "./dashboardData";

export const platformManagementKpis = [
  {
    label: "Total Professionals",
    value: "1,365",
    trend: 18.7,
    iconKey: "professionals" as const,
    iconColor: "#149CA7",
    iconBg: "rgba(33, 184, 191, 0.12)",
  },
  {
    label: "Total Clients",
    value: "8,742",
    trend: 14.3,
    iconKey: "clients" as const,
    iconColor: "#2E7D32",
    iconBg: "rgba(76, 175, 80, 0.12)",
  },
  {
    label: "Total Bookings",
    value: "13,073",
    trend: 22.1,
    iconKey: "bookings" as const,
    iconColor: "#DC6803",
    iconBg: "rgba(220, 104, 3, 0.14)",
  },
  {
    label: "Total Reviews",
    value: "3,859",
    trend: 16.8,
    iconKey: "reviews" as const,
    iconColor: "#D92D20",
    iconBg: "rgba(217, 45, 32, 0.12)",
  },
  {
    label: "Reported Users",
    value: "27",
    trend: 10.3,
    invertTrend: true,
    iconKey: "reported" as const,
    iconColor: "#2563EB",
    iconBg: "rgba(59, 130, 246, 0.12)",
  },
];

export const platformFlaggedReviews = [
  { id: "pfr1", professional: "Beauty by Sarah", initials: "BS", date: "Jul 10, 2025" },
  { id: "pfr2", professional: "Glamour Studio", initials: "GS", date: "Jul 9, 2025" },
  { id: "pfr3", professional: "Urban Cuts", initials: "UC", date: "Jul 8, 2025" },
  { id: "pfr4", professional: "Glow Studio", initials: "GS", date: "Jul 7, 2025" },
  { id: "pfr5", professional: "Luxe Hair & Spa", initials: "LH", date: "Jul 6, 2025" },
];

export const platformRecentReports = [
  {
    id: "pr1",
    reporter: "Emma de Vries",
    initials: "ED",
    reported: "Urban Cuts",
    status: "new" as const,
  },
  {
    id: "pr2",
    reporter: "Marcus Weber",
    initials: "MW",
    reported: "Glow Studio",
    status: "viewed" as const,
  },
  {
    id: "pr3",
    reporter: "Sofia Rodriguez",
    initials: "SR",
    reported: "Lisa Jansen",
    status: "new" as const,
  },
  {
    id: "pr4",
    reporter: "James O'Connor",
    initials: "JO",
    reported: "Beauty Corp B.V.",
    status: "viewed" as const,
  },
];

export const platformContactMessages = [
  {
    id: "pcm1",
    category: "Support Request",
    sender: "John Doe",
    date: "Jul 12, 2025",
    time: "10:32 AM",
    status: "new" as const,
  },
  {
    id: "pcm2",
    category: "Partnership Inquiry",
    sender: "Anna Smit",
    date: "Jul 11, 2025",
    time: "3:15 PM",
    status: "replied" as const,
  },
  {
    id: "pcm3",
    category: "General Inquiry",
    sender: "Elena Popov",
    date: "Jul 11, 2025",
    time: "9:48 AM",
    status: "new" as const,
  },
  {
    id: "pcm4",
    category: "Billing Question",
    sender: "Michael Chen",
    date: "Jul 10, 2025",
    time: "2:20 PM",
    status: "replied" as const,
  },
];

export const platformRatingCategories = [
  { id: "bad", label: "Bad", emoji: "😞", min: 1.0, max: 2.9, color: "#D92D20", bg: "rgba(217, 45, 32, 0.1)" },
  { id: "good", label: "Good", emoji: "😐", min: 3.0, max: 4.4, color: "#DC6803", bg: "rgba(220, 104, 3, 0.12)" },
  { id: "excellent", label: "Excellent", emoji: "😊", min: 4.5, max: 5.0, color: "#2E7D32", bg: "rgba(76, 175, 80, 0.12)" },
];

export const platformSeoLinks = [
  {
    title: ADMIN_QUICK_LINKS[0].title,
    description: "Monitor search performance, indexing, and site visibility.",
    href: ADMIN_QUICK_LINKS[0].href,
    logoLabel: ADMIN_QUICK_LINKS[0].logoLabel,
    logoBg: ADMIN_QUICK_LINKS[0].logoBg,
    logoColor: ADMIN_QUICK_LINKS[0].logoColor,
  },
  {
    title: ADMIN_QUICK_LINKS[1].title,
    description: "Track website traffic, user behavior, and conversions.",
    href: ADMIN_QUICK_LINKS[1].href,
    logoLabel: ADMIN_QUICK_LINKS[1].logoLabel,
    logoBg: ADMIN_QUICK_LINKS[1].logoBg,
    logoColor: ADMIN_QUICK_LINKS[1].logoColor,
  },
];

export const PLATFORM_MANAGEMENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "ranking", label: "Ranking Settings" },
  { id: "reviews", label: "Review Management" },
  { id: "reports", label: "Reports" },
  { id: "messaging", label: "Messaging & Email" },
] as const;

export type PlatformManagementTabId = (typeof PLATFORM_MANAGEMENT_TABS)[number]["id"];
