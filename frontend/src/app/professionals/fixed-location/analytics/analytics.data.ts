export type ProfessionalAnalyticsSubTab =
  | "Booking and Operational Analytics"
  | "Sales Volume Analytics"
  | "Performance Analytics"
  | "Rating and Review Analytics";

export type BookingOriginRow = {
  origin: string;
  flCount: number;
  dlCount: number;
  projectCount: number;
  total: number;
  sharePct: number;
  isTotal?: boolean;
};

export type BookingStatusSummaryRow = {
  status: string;
  count: number;
  sharePct: number;
  isTotal?: boolean;
};

export type AttendanceNoShowRow = {
  bookingType: string;
  noShowCount: number;
  sharePct: number;
  isTotal?: boolean;
};

export type ReschedulingSummaryRow = {
  category: string;
  count: number;
  isTotal?: boolean;
};

export type BookingByClientTypeRow = {
  clientType: string;
  count: number;
  sharePct: number;
  isTotal?: boolean;
};

export type BookingByServiceCategoryRow = {
  category: string;
  count: number;
  sharePct: number;
  isTotal?: boolean;
};

export type ProfessionalFixedLocationAnalyticsData = {
  header: {
    title: string;
    subtitle: string;
  };
  subTabs: readonly ProfessionalAnalyticsSubTab[];
  initialSubTab: ProfessionalAnalyticsSubTab;
  sections: {
    bookingOriginAndType: {
      title: string;
      rows: readonly BookingOriginRow[];
      explanationLabel: string;
    };
    bookingStatusSummary: {
      title: string;
      rows: readonly BookingStatusSummaryRow[];
      explanationLabel: string;
    };
    attendanceNoShowAnalytics: {
      title: string;
      rows: readonly AttendanceNoShowRow[];
      explanationLabel: string;
    };
    reschedulingSummary: {
      title: string;
      rows: readonly ReschedulingSummaryRow[];
      explanationLabel: string;
    };
    bookingByClientType: {
      title: string;
      rows: readonly BookingByClientTypeRow[];
      explanationLabel: string;
    };
    bookingByServiceCategory: {
      title: string;
      rows: readonly BookingByServiceCategoryRow[];
      explanationLabel: string;
    };
  };
};

export const professionalFixedLocationAnalyticsData: ProfessionalFixedLocationAnalyticsData = {
  header: {
    title: "Professional Analytics",
    subtitle: "View booking, sales, performance and review analytics.",
  },
  subTabs: [
    "Booking and Operational Analytics",
    "Sales Volume Analytics",
    "Performance Analytics",
    "Rating and Review Analytics",
  ],
  initialSubTab: "Booking and Operational Analytics",
  sections: {
    bookingOriginAndType: {
      title: "1.1 Booking Origin and type",
      rows: [
        { origin: "Online", flCount: 50, dlCount: 30, projectCount: 10, total: 90, sharePct: 60 },
        { origin: "Offline", flCount: 35, dlCount: 20, projectCount: 5, total: 60, sharePct: 40 },
        { origin: "Total", flCount: 85, dlCount: 50, projectCount: 15, total: 150, sharePct: 100, isTotal: true },
      ],
      explanationLabel: "View Explanation",
    },
    bookingStatusSummary: {
      title: "1.2 Booking Status Summary",
      rows: [
        { status: "Requested", count: 60, sharePct: 30 },
        { status: "Confirmed", count: 120, sharePct: 60 },
        { status: "Instantly Confirmed", count: 90, sharePct: 45 },
        { status: "Converted from Requested", count: 30, sharePct: 15 },
        { status: "Completed", count: 100, sharePct: 50 },
        { status: "Cancelled", count: 40, sharePct: 20 },
        { status: "Total", count: 200, sharePct: 100, isTotal: true },
      ],
      explanationLabel: "View Explanation",
    },
    attendanceNoShowAnalytics: {
      title: "1.3 Attendance / No-Show Analytics",
      rows: [
        { bookingType: "Fixed Location (FL)", noShowCount: 10, sharePct: 5 },
        { bookingType: "Desired Location (Normal DL)", noShowCount: 8, sharePct: 4 },
        { bookingType: "Project DL Booking", noShowCount: 2, sharePct: 1 },
        { bookingType: "Total (All Bookings)", noShowCount: 20, sharePct: 10, isTotal: true },
      ],
      explanationLabel: "View Explanation",
    },
    reschedulingSummary: {
      title: "1.4 Rescheduling Summary",
      rows: [
        { category: "Reschedules", count: 20 },
      ],
      explanationLabel: "View Explanation",
    },
    bookingByClientType: {
      title: "1.5 Booking by Client Type",
      rows: [
        { clientType: "IC – Individual Client", count: 10, sharePct: 5 },
        { clientType: "CC – Company Client", count: 8, sharePct: 4 },
        { clientType: "Guest booking", count: 2, sharePct: 1 },
      ],
      explanationLabel: "View Explanation",
    },
    bookingByServiceCategory: {
      title: "1.6 Booking by Service Category",
      rows: [
        { category: "Hair", count: 42, sharePct: 21 },
        { category: "Make-up", count: 30, sharePct: 15 },
        { category: "Lashes", count: 18, sharePct: 9 },
        { category: "Brows", count: 10, sharePct: 5 },
      ],
      explanationLabel: "View Explanation",
    },
  },
};

