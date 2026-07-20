export const dashboardTrendData = [
  { date: "Mon", professionals: 4, clients: 12, onlineBookings: 28, offlineBookings: 9 },
  { date: "Tue", professionals: 6, clients: 18, onlineBookings: 35, offlineBookings: 11 },
  { date: "Wed", professionals: 3, clients: 15, onlineBookings: 31, offlineBookings: 8 },
  { date: "Thu", professionals: 8, clients: 22, onlineBookings: 42, offlineBookings: 14 },
  { date: "Fri", professionals: 5, clients: 19, onlineBookings: 38, offlineBookings: 12 },
  { date: "Sat", professionals: 7, clients: 25, onlineBookings: 48, offlineBookings: 16 },
  { date: "Sun", professionals: 4, clients: 14, onlineBookings: 26, offlineBookings: 7 },
];

export const dashboardBookingSplit = [
  { name: "Online", value: 1248 },
  { name: "Offline", value: 412 },
];

export const dashboardClientSplit = [
  { name: "Individual (IC)", value: 2840 },
  { name: "Company (CC)", value: 620 },
];

export const dashboardKpisByRange = {
  today: {
    professionals: 12,
    newProfessionals: 2,
    clients: 48,
    newClients: 8,
    newIC: 6,
    newCC: 2,
    onlineBookings: 34,
    offlineBookings: 11,
  },
  "7d": {
    professionals: 186,
    newProfessionals: 14,
    clients: 312,
    newClients: 67,
    newIC: 52,
    newCC: 15,
    onlineBookings: 248,
    offlineBookings: 82,
  },
  "30d": {
    professionals: 742,
    newProfessionals: 48,
    clients: 1240,
    newClients: 284,
    newIC: 218,
    newCC: 66,
    onlineBookings: 1248,
    offlineBookings: 412,
  },
  year: {
    professionals: 892,
    newProfessionals: 156,
    clients: 3460,
    newClients: 892,
    newIC: 712,
    newCC: 180,
    onlineBookings: 8420,
    offlineBookings: 2180,
  },
  custom: {
    professionals: 742,
    newProfessionals: 48,
    clients: 1240,
    newClients: 284,
    newIC: 218,
    newCC: 66,
    onlineBookings: 1248,
    offlineBookings: 412,
  },
};

export type RankingImpact = "high" | "medium" | "low";

export type RankingFactor = {
  id: string;
  label: string;
  description: string;
  weight: number;
  impact: RankingImpact;
};

export const rankingFactors: RankingFactor[] = [
  {
    id: "onlineBooking",
    label: "Online booking count",
    description: "Number of completed online bookings in the selected period",
    weight: 30,
    impact: "high",
  },
  {
    id: "onlineTransaction",
    label: "Online transaction count",
    description: "Total completed online payment transactions",
    weight: 25,
    impact: "high",
  },
  {
    id: "avgRating",
    label: "Average rating",
    description: "Mean star rating across all verified reviews",
    weight: 20,
    impact: "medium",
  },
  {
    id: "totalReviews",
    label: "Total reviews",
    description: "Count of published reviews from clients",
    weight: 15,
    impact: "medium",
  },
  {
    id: "activity",
    label: "Recent activity",
    description: "Recency of the last completed booking",
    weight: 10,
    impact: "low",
  },
];

/** @deprecated Use rankingFactors */
export const rankingWeights = rankingFactors.map(({ id, label, weight }) => ({ id, label, weight }));

export type AdminUserStatus = "active" | "disabled";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AdminUserStatus;
};

export const mockAdminUsers: AdminUser[] = [
  { id: "1", name: "Sarah Admin", email: "admin@molur.com", role: "super_admin", status: "active" },
  { id: "2", name: "Dev Support", email: "dev01@molur.com", role: "developer_support", status: "active" },
  { id: "3", name: "Legacy Admin", email: "old@molur.com", role: "super_admin", status: "disabled" },
];

export type ProfessionalCategory =
  | "Hair & Beauty"
  | "Wellness & Spa"
  | "Fitness & Training"
  | "Make-up & Skincare"
  | "Barber";

export type MockProfessional = {
  id: string;
  registrationDate: string;
  brandName: string;
  legalName: string;
  email: string;
  phone: string;
  serviceMode: "FL" | "DL" | "DL Project";
  validationStatus: "pending" | "validated" | "not_validated";
  verificationDate?: string;
  accountStatus: "awaiting_setup" | "active" | "suspended" | "disabled";
  primaryCategory: ProfessionalCategory;
  categories: string[];
  onlineBookings: number;
  offlineBookings: number;
  onlineTransactions: number;
  offlineTransactions: number;
  avgRating: number;
  totalReviews: number;
  ranking: number;
  lastBooking: string;
  province: string;
};

const professionalSeed: Omit<MockProfessional, "id">[] = [
  {
    registrationDate: "2025-01-08",
    brandName: "Sarah Johnson",
    legalName: "Sarah Johnson Beauty B.V.",
    email: "sarah@sarahbeauty.nl",
    phone: "+31 6 12345678",
    serviceMode: "FL",
    validationStatus: "validated",
    verificationDate: "2025-01-10",
    accountStatus: "active",
    primaryCategory: "Hair & Beauty",
    categories: ["Hair", "Nails"],
    onlineBookings: 142,
    offlineBookings: 38,
    onlineTransactions: 128,
    offlineTransactions: 35,
    avgRating: 4.7,
    totalReviews: 89,
    ranking: 1,
    lastBooking: "2025-01-13",
    province: "Noord-Holland",
  },
  {
    registrationDate: "2024-11-22",
    brandName: "Glow Studio",
    legalName: "Glow Studio",
    email: "info@glowstudio.nl",
    phone: "+31 6 87654321",
    serviceMode: "DL",
    validationStatus: "pending",
    accountStatus: "awaiting_setup",
    primaryCategory: "Make-up & Skincare",
    categories: ["Make-up", "Skincare"],
    onlineBookings: 56,
    offlineBookings: 12,
    onlineTransactions: 48,
    offlineTransactions: 10,
    avgRating: 4.3,
    totalReviews: 34,
    ranking: 8,
    lastBooking: "2025-01-10",
    province: "Utrecht",
  },
  {
    registrationDate: "2024-09-15",
    brandName: "Urban Cuts",
    legalName: "Urban Cuts Freelance",
    email: "contact@urbancuts.nl",
    phone: "+31 6 11223344",
    serviceMode: "DL Project",
    validationStatus: "not_validated",
    accountStatus: "suspended",
    primaryCategory: "Barber",
    categories: ["Barber", "Hair"],
    onlineBookings: 28,
    offlineBookings: 64,
    onlineTransactions: 22,
    offlineTransactions: 58,
    avgRating: 3.8,
    totalReviews: 21,
    ranking: 24,
    lastBooking: "2024-12-28",
    province: "Zuid-Holland",
  },
  {
    registrationDate: "2025-01-02",
    brandName: "Zen Wellness",
    legalName: "Zen Wellness NL",
    email: "hello@zenwellness.nl",
    phone: "+31 6 99887766",
    serviceMode: "FL",
    validationStatus: "validated",
    verificationDate: "2025-01-04",
    accountStatus: "active",
    primaryCategory: "Wellness & Spa",
    categories: ["Massage", "Spa"],
    onlineBookings: 98,
    offlineBookings: 22,
    onlineTransactions: 90,
    offlineTransactions: 18,
    avgRating: 4.9,
    totalReviews: 56,
    ranking: 3,
    lastBooking: "2025-01-12",
    province: "Noord-Brabant",
  },
  {
    registrationDate: "2024-12-18",
    brandName: "FitLife Coaching",
    legalName: "FitLife Coaching",
    email: "coach@fitlife.nl",
    phone: "+31 6 55443322",
    serviceMode: "DL",
    validationStatus: "validated",
    verificationDate: "2024-12-20",
    accountStatus: "active",
    primaryCategory: "Fitness & Training",
    categories: ["Personal Training", "Nutrition"],
    onlineBookings: 74,
    offlineBookings: 31,
    onlineTransactions: 68,
    offlineTransactions: 28,
    avgRating: 4.6,
    totalReviews: 42,
    ranking: 5,
    lastBooking: "2025-01-11",
    province: "Gelderland",
  },
  {
    registrationDate: "2024-10-30",
    brandName: "Luxe Makeup",
    legalName: "Luxe Makeup Studio",
    email: "book@luxemakeup.nl",
    phone: "+31 6 66778899",
    serviceMode: "FL",
    validationStatus: "pending",
    accountStatus: "active",
    primaryCategory: "Make-up & Skincare",
    categories: ["Make-up", "Bridal"],
    onlineBookings: 45,
    offlineBookings: 18,
    onlineTransactions: 40,
    offlineTransactions: 15,
    avgRating: 4.4,
    totalReviews: 28,
    ranking: 12,
    lastBooking: "2025-01-08",
    province: "Noord-Holland",
  },
  {
    registrationDate: "2024-08-12",
    brandName: "Classic Barber Co",
    legalName: "Classic Barber Co",
    email: "info@classicbarber.nl",
    phone: "+31 6 22113344",
    serviceMode: "FL",
    validationStatus: "not_validated",
    accountStatus: "disabled",
    primaryCategory: "Barber",
    categories: ["Barber", "Grooming"],
    onlineBookings: 12,
    offlineBookings: 8,
    onlineTransactions: 10,
    offlineTransactions: 6,
    avgRating: 3.2,
    totalReviews: 9,
    ranking: 45,
    lastBooking: "2024-11-20",
    province: "Limburg",
  },
  {
    registrationDate: "2025-01-05",
    brandName: "Emma Styles",
    legalName: "Emma Styles",
    email: "emma@emmastyles.nl",
    phone: "+31 6 77889900",
    serviceMode: "DL",
    validationStatus: "validated",
    verificationDate: "2025-01-06",
    accountStatus: "active",
    primaryCategory: "Hair & Beauty",
    categories: ["Hair", "Colour"],
    onlineBookings: 31,
    offlineBookings: 6,
    onlineTransactions: 28,
    offlineTransactions: 5,
    avgRating: 4.8,
    totalReviews: 14,
    ranking: 18,
    lastBooking: "2025-01-13",
    province: "Utrecht",
  },
  {
    registrationDate: "2024-07-21",
    brandName: "Serenity Spa",
    legalName: "Serenity Spa B.V.",
    email: "relax@serenityspa.nl",
    phone: "+31 6 33445566",
    serviceMode: "FL",
    validationStatus: "validated",
    verificationDate: "2024-07-25",
    accountStatus: "active",
    primaryCategory: "Wellness & Spa",
    categories: ["Spa", "Facial"],
    onlineBookings: 112,
    offlineBookings: 44,
    onlineTransactions: 105,
    offlineTransactions: 40,
    avgRating: 4.5,
    totalReviews: 67,
    ranking: 4,
    lastBooking: "2025-01-09",
    province: "Zuid-Holland",
  },
  {
    registrationDate: "2024-12-01",
    brandName: "Power Gym PT",
    legalName: "Power Gym PT",
    email: "pt@powergym.nl",
    phone: "+31 6 88990011",
    serviceMode: "DL Project",
    validationStatus: "pending",
    accountStatus: "awaiting_setup",
    primaryCategory: "Fitness & Training",
    categories: ["Personal Training"],
    onlineBookings: 8,
    offlineBookings: 4,
    onlineTransactions: 6,
    offlineTransactions: 3,
    avgRating: 0,
    totalReviews: 0,
    ranking: 62,
    lastBooking: "2024-12-15",
    province: "Flevoland",
  },
];

function generateMockProfessionals(): MockProfessional[] {
  const categories: ProfessionalCategory[] = [
    "Hair & Beauty",
    "Wellness & Spa",
    "Fitness & Training",
    "Make-up & Skincare",
    "Barber",
  ];
  const validationStatuses: MockProfessional["validationStatus"][] = [
    "validated",
    "pending",
    "not_validated",
  ];
  const accountStatuses: MockProfessional["accountStatus"][] = [
    "active",
    "awaiting_setup",
    "suspended",
    "disabled",
  ];
  const modes: MockProfessional["serviceMode"][] = ["FL", "DL", "DL Project"];

  const extra: MockProfessional[] = [];
  for (let i = 0; i < 22; i++) {
    const category = categories[i % categories.length];
    const validation = validationStatuses[i % validationStatuses.length];
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 28) + 1).padStart(2, "0");
    extra.push({
      id: `p-gen-${i + 1}`,
      registrationDate: `2024-${month}-${day}`,
      brandName: `Professional ${i + 11}`,
      legalName: `Professional ${i + 11} B.V.`,
      email: `pro${i + 11}@email.nl`,
      phone: `+31 6 ${String(2000000 + i).slice(1)}`,
      serviceMode: modes[i % modes.length],
      validationStatus: validation,
      verificationDate: validation === "validated" ? `2024-${month}-${String(Number(day) + 2).padStart(2, "0")}` : undefined,
      accountStatus: accountStatuses[i % accountStatuses.length],
      primaryCategory: category,
      categories: [category.split(" ")[0]],
      onlineBookings: 10 + i * 3,
      offlineBookings: 4 + i,
      onlineTransactions: 8 + i * 2,
      offlineTransactions: 3 + i,
      avgRating: validation === "validated" ? 3.5 + (i % 15) / 10 : 0,
      totalReviews: validation === "validated" ? 5 + i * 2 : 0,
      ranking: 10 + i,
      lastBooking: `2025-${month}-${day}`,
      province: "Noord-Holland",
    });
  }

  return [
    ...professionalSeed.map((p, idx) => ({ ...p, id: `p${idx + 1}` })),
    ...extra,
  ];
}

export const mockProfessionals: MockProfessional[] = generateMockProfessionals();

export const professionalManagementSummary = {
  total: 1365,
  verified: 985,
  pending: 152,
  rejected: 48,
  inactive: 180,
  growthTrend: 18.7,
};

export const professionalTopCategories = [
  { name: "Hair & Beauty" as ProfessionalCategory, count: 452 },
  { name: "Wellness & Spa" as ProfessionalCategory, count: 318 },
  { name: "Fitness & Training" as ProfessionalCategory, count: 245 },
  { name: "Make-up & Skincare" as ProfessionalCategory, count: 198 },
  { name: "Barber" as ProfessionalCategory, count: 152 },
];

export const professionalVerificationOverview = [
  { name: "Verified", value: professionalManagementSummary.verified },
  { name: "Pending", value: professionalManagementSummary.pending },
  { name: "Rejected", value: professionalManagementSummary.rejected },
  { name: "Inactive", value: professionalManagementSummary.inactive },
];

export type MockClient = {
  id: string;
  registrationDate: string;
  registrationTime: string;
  name: string;
  email: string;
  phone: string;
  type: "IC" | "CC";
  lastBookingDate: string;
  lastBookingTime: string;
  accountStatus: "active" | "disabled" | "deleted";
  hasNotes?: boolean;
  note?: string;
  avatarUrl?: string;
  birthdate?: string;
  gender?: string;
  contactPerson?: string;
};

const clientSeed: Omit<MockClient, "id">[] = [
  {
    registrationDate: "2025-09-12",
    registrationTime: "14:32",
    name: "Emma Thompson",
    email: "emma.thompson@email.com",
    phone: "+31 6 1234 5678",
    type: "IC",
    lastBookingDate: "2025-11-20",
    lastBookingTime: "10:15",
    accountStatus: "active",
    hasNotes: true,
    note: "VIP client — prefers morning appointments.",
  },
  {
    registrationDate: "2025-08-24",
    registrationTime: "09:18",
    name: "Corporate Events Ltd",
    email: "contact@corpevents.com",
    phone: "+31 20 987 6543",
    type: "CC",
    lastBookingDate: "2025-11-18",
    lastBookingTime: "16:40",
    accountStatus: "active",
    contactPerson: "Sarah Mitchell",
  },
  {
    registrationDate: "2025-07-03",
    registrationTime: "11:05",
    name: "Marcus Weber",
    email: "marcus.weber@email.com",
    phone: "+31 6 8765 4321",
    type: "IC",
    lastBookingDate: "2025-11-15",
    lastBookingTime: "13:22",
    accountStatus: "active",
  },
  {
    registrationDate: "2025-06-19",
    registrationTime: "16:47",
    name: "Wellness Retreats BV",
    email: "info@wellnessretreats.nl",
    phone: "+31 30 456 7890",
    type: "CC",
    lastBookingDate: "2025-10-02",
    lastBookingTime: "09:00",
    accountStatus: "disabled",
    contactPerson: "Anna de Boer",
  },
  {
    registrationDate: "2025-05-28",
    registrationTime: "08:55",
    name: "Sofia Rodriguez",
    email: "sofia.r@email.com",
    phone: "+31 6 2345 6789",
    type: "IC",
    lastBookingDate: "2025-11-22",
    lastBookingTime: "15:30",
    accountStatus: "active",
    hasNotes: true,
  },
  {
    registrationDate: "2025-04-11",
    registrationTime: "13:20",
    name: "Nordic Design Studio",
    email: "hello@nordicdesign.nl",
    phone: "+31 70 123 4567",
    type: "CC",
    lastBookingDate: "2025-08-14",
    lastBookingTime: "11:45",
    accountStatus: "deleted",
    contactPerson: "Lars Johansson",
  },
  {
    registrationDate: "2025-03-07",
    registrationTime: "10:33",
    name: "James O'Connor",
    email: "james.oconnor@email.com",
    phone: "+31 6 3456 7890",
    type: "IC",
    lastBookingDate: "2025-11-19",
    lastBookingTime: "14:08",
    accountStatus: "active",
  },
  {
    registrationDate: "2025-02-22",
    registrationTime: "15:12",
    name: "Global Logistics Inc",
    email: "bookings@globallogistics.com",
    phone: "+31 10 555 0199",
    type: "CC",
    lastBookingDate: "2025-11-21",
    lastBookingTime: "08:30",
    accountStatus: "active",
    contactPerson: "Michael Chen",
  },
  {
    registrationDate: "2025-01-16",
    registrationTime: "12:01",
    name: "Elena Popov",
    email: "elena.popov@email.com",
    phone: "+31 6 4567 8901",
    type: "IC",
    lastBookingDate: "2025-11-17",
    lastBookingTime: "17:55",
    accountStatus: "active",
  },
  {
    registrationDate: "2024-12-09",
    registrationTime: "09:44",
    name: "Bright Horizons Daycare",
    email: "admin@brighthorizons.nl",
    phone: "+31 35 678 9012",
    type: "CC",
    lastBookingDate: "2025-11-10",
    lastBookingTime: "12:20",
    accountStatus: "active",
    contactPerson: "Priya Sharma",
  },
  {
    registrationDate: "2024-11-22",
    registrationTime: "14:18",
    name: "Lisa Jansen",
    email: "lisa.j@email.nl",
    phone: "+31 6 55443322",
    type: "IC",
    lastBookingDate: "2024-11-30",
    lastBookingTime: "10:00",
    accountStatus: "disabled",
    birthdate: "1988-11-02",
    gender: "Female",
  },
  {
    registrationDate: "2024-10-20",
    registrationTime: "11:30",
    name: "Beauty Corp B.V.",
    email: "hr@beautycorp.nl",
    phone: "+31 20 1234567",
    type: "CC",
    lastBookingDate: "2025-01-08",
    lastBookingTime: "14:45",
    accountStatus: "active",
    contactPerson: "Jan Bakker",
  },
];

function generateMockClients(): MockClient[] {
  const statuses: MockClient["accountStatus"][] = ["active", "active", "active", "disabled", "deleted"];
  const types: MockClient["type"][] = ["IC", "CC"];
  const extra: MockClient[] = [];

  for (let i = 0; i < 38; i += 1) {
    const type = types[i % 2];
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 28) + 1).padStart(2, "0");
    extra.push({
      id: `c-gen-${i + 1}`,
      registrationDate: `2024-${month}-${day}`,
      registrationTime: `${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      name: type === "IC" ? `Client ${i + 13}` : `Company ${i + 13} B.V.`,
      email: type === "IC" ? `client${i + 13}@email.nl` : `info@company${i + 13}.nl`,
      phone: `+31 6 ${String(1000000 + i).slice(1)}`,
      type,
      lastBookingDate: `2025-${month}-${day}`,
      lastBookingTime: `${String(9 + (i % 8)).padStart(2, "0")}:00`,
      accountStatus: statuses[i % statuses.length],
      hasNotes: i % 5 === 0,
    });
  }

  return [
    ...clientSeed.map((c, idx) => ({ ...c, id: `c${idx + 1}` })),
    ...extra,
  ];
}

export const mockClients: MockClient[] = generateMockClients();

export const clientManagementSummary = {
  totalIC: 876,
  totalCC: 372,
  totalClients: 1248,
  totalBookings: 8542,
};

export const mockFlaggedKeywords = ["scam", "fraud", "terrible service", "refund now"];

export const mockFlaggedReviews = [
  {
    id: "r1",
    professional: "Urban Cuts",
    client: "Anonymous",
    rating: 1,
    text: "Terrible service, felt like a scam.",
    date: "2025-01-11",
  },
  {
    id: "r2",
    professional: "Glow Studio",
    client: "Mark V.",
    rating: 2,
    text: "Not worth the price, fraud advertising.",
    date: "2025-01-09",
  },
];

export const mockReports = [
  {
    id: "rep1",
    reporter: "Emma de Vries",
    reported: "Urban Cuts",
    reason: "Unprofessional behavior",
    date: "2025-01-12",
    status: "new" as const,
  },
  {
    id: "rep2",
    reporter: "Sarah Beauty",
    reported: "Lisa Jansen",
    reason: "No-show for appointment",
    date: "2025-01-10",
    status: "viewed" as const,
  },
];

export const mockMessages = [
  {
    id: "m1",
    name: "John Doe",
    email: "john@email.nl",
    subject: "General inquiry",
    date: "2025-01-14",
    status: "new" as const,
    body: "I have a question about booking for my company.",
  },
  {
    id: "m2",
    name: "Anna Smit",
    email: "anna@email.nl",
    subject: "Partnership",
    date: "2025-01-13",
    status: "replied" as const,
    body: "We would like to discuss a partnership opportunity.",
  },
];

export const mockActivityLog = [
  {
    id: "a1",
    timestamp: "2025-01-14 09:21",
    admin: "admin@molur.com",
    action: "Validated professional",
    description: "Professional Sarah Beauty validated",
  },
  {
    id: "a2",
    timestamp: "2025-01-14 09:45",
    admin: "dev01@molur.com",
    action: "Deleted review",
    description: "Review ID #829 removed",
  },
  {
    id: "a3",
    timestamp: "2025-01-14 10:02",
    admin: "admin@molur.com",
    action: "Disabled account",
    description: "Client ID #221 account disabled",
  },
  {
    id: "a4",
    timestamp: "2025-01-14 11:05",
    admin: "dev02@molur.com",
    action: "Edited content",
    description: "Updated NL homepage hero text",
  },
];

export const ratingCategoryDefaults = {
  bad: { min: 1.0, max: 2.9 },
  good: { min: 3.0, max: 4.4 },
  excellent: { min: 4.5, max: 5.0 },
};
