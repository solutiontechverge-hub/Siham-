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

export type TransactionSummaryRow = {
  channel: string;
  count: number;
  sharePct: number;
  isTotal?: boolean;
};

export type AnalyticsExplanationItem = {
  title: string;
  description: string;
};

export type AnalyticsExplanationBlock = {
  title: string;
  items?: AnalyticsExplanationItem[];
  paragraphs?: string[];
};

export type AnalyticsExplanationContent = {
  blocks: AnalyticsExplanationBlock[];
};

import type { ProfessionalFixedLocationSalesVolumeAnalyticsData } from "./salesVolumeAnalytics.data";
import { professionalFixedLocationSalesVolumeAnalyticsData } from "./salesVolumeAnalytics.data";
import type { ProfessionalFixedLocationPerformanceAnalyticsData } from "./performanceAnalytics.data";
import { professionalFixedLocationPerformanceAnalyticsData } from "./performanceAnalytics.data";
import type { ProfessionalFixedLocationRatingReviewAnalyticsData } from "./ratingReviewAnalytics.data";
import { professionalFixedLocationRatingReviewAnalyticsData } from "./ratingReviewAnalytics.data";

export type ProfessionalFixedLocationAnalyticsData = {
  header: {
    title: string;
    subtitle: string;
  };
  subTabs: readonly ProfessionalAnalyticsSubTab[];
  initialSubTab: ProfessionalAnalyticsSubTab;
  salesVolume: ProfessionalFixedLocationSalesVolumeAnalyticsData;
  performance: ProfessionalFixedLocationPerformanceAnalyticsData;
  ratingReview: ProfessionalFixedLocationRatingReviewAnalyticsData;
  sections: {
    bookingOriginAndType: {
      title: string;
      rows: readonly BookingOriginRow[];
      explanationLabel: string;
      explanationContent?: AnalyticsExplanationContent;
    };
    bookingStatusSummary: {
      title: string;
      rows: readonly BookingStatusSummaryRow[];
      explanationLabel: string;
      explanationContent?: AnalyticsExplanationContent;
    };
    attendanceNoShowAnalytics: {
      title: string;
      rows: readonly AttendanceNoShowRow[];
      explanationLabel: string;
      explanationContent?: AnalyticsExplanationContent;
    };
    transactionSummary: {
      title: string;
      rows: readonly TransactionSummaryRow[];
      explanationLabel: string;
      explanationContent?: AnalyticsExplanationContent;
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
  salesVolume: professionalFixedLocationSalesVolumeAnalyticsData,
  performance: professionalFixedLocationPerformanceAnalyticsData,
  ratingReview: professionalFixedLocationRatingReviewAnalyticsData,
  sections: {
    bookingOriginAndType: {
      title: "1.1 Booking Origin and type",
      rows: [],
      explanationLabel: "View Explanation",
      explanationContent: {
        blocks: [
          {
            title: "Booking Origin",
            items: [
              {
                title: "Online Booking",
                description:
                  "An online booking is any booking that includes at least one MOLUR client and is processed through the MOLUR interactive booking workflow (whether initiated by the client or the professional).\nIt must have reached Confirmed status at least once, even if it was later cancelled.",
              },
              {
                title: "Offline Booking",
                description:
                  "An offline booking is created manually by the professional outside the MOLUR interactive workflow.\nThis occurs when the booking includes a non-MOLUR client from the client list or is created as a guest booking (all participants are guests).\nOffline bookings are immediately confirmed upon saving.",
              },
            ],
          },
          {
            title: "Booking Type",
            paragraphs: [
              "FL (Fixed Location), DL (Desired Location), and Project bookings follow the same online/offline rules above.",
              "This table simply shows how each booking origin distributes across booking types.",
            ],
          },
        ],
      },
    },
    bookingStatusSummary: {
      title: "1.2 Booking Outcome Summary",
      rows: [],
      explanationLabel: "View Explanation",
      explanationContent: {
        blocks: [
          {
            title: "Booking Outcome Summary",
            paragraphs: [
              "All metrics below count bookings as a whole, regardless of how many people are included in each booking.",
            ],
            items: [
              {
                title: "Confirmed Booking",
                description:
                  "Bookings that have successfully reached the Confirmed status at least once, regardless of what happened afterward. This includes also offline bookings that are confirmed upon creation.",
              },
              {
                title: "Completed Booking",
                description:
                  "Bookings where all services have been delivered and all payments have been received. Once a booking reaches completed status, it's counted as completed.",
              },
              {
                title: "Rescheduled Booking",
                description:
                  "A rescheduling is counted each time a booking's date and/or time is changed, whether the change is made by the professional or by the client.\nEach rescheduling action is counted as one entry. If the date and time are updated together in a single step, it counts as one reschedule. If they are changed separately, each change is counted individually. Multiple adjustments made to the same booking are all counted separately.",
              },
              {
                title: "Cancelled Booking",
                description:
                  "Confirmed bookings that were later cancelled by either the professional or the client.",
              },
            ],
          },
        ],
      },
    },
    attendanceNoShowAnalytics: {
      title: "1.3 Attendance / No-Show Summary",
      rows: [],
      explanationLabel: "View Explanation",
      explanationContent: {
        blocks: [
          {
            title: "Attendance",
            paragraphs: [
              "Each person in a booking is counted individually; one booking can generate multiple no-shows.",
            ],
          },
        ],
      },
    },
    transactionSummary: {
      title: "1.6 Transaction Summary",
      rows: [],
      explanationLabel: "View Explanation",
      explanationContent: {
        blocks: [
          {
            title: "",
            paragraphs: [
              "Counts all payments processed through Mollure from online bookings, offline bookings, or manual transactions outside of bookings. Each payment equals one transaction. Split bills count as multiple transactions.",
            ],
          },
        ],
      },
    },
  },
};

