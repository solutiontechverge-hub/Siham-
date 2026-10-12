export type ProductivityEfficiencyRow = {
  teamMember: string;
  hoursWorked: number;
  completedBookings: number;
  revenueEur: number;
  productivityEurPerHr: number;
  efficiencyPct: number;
  averageRating: number;
  reviews: number;
  isAverage?: boolean;
};

export type ProfessionalFixedLocationPerformanceAnalyticsData = {
  productivityAndEfficiency: {
    title: string;
    rows: readonly ProductivityEfficiencyRow[];
    explanationLabel: string;
    explanationContent?: import("./analytics.data").AnalyticsExplanationContent;
  };
};

/** Titles only — rows come from live calendar + reviews APIs. */
export const professionalFixedLocationPerformanceAnalyticsData: ProfessionalFixedLocationPerformanceAnalyticsData = {
  productivityAndEfficiency: {
    title: "3.1 Productivity & Efficiency",
    rows: [],
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "",
          paragraphs: [
            "Productivity shows how much revenue each team member generates per hour worked, while efficiency reflects how consistently they complete the bookings they handle. This helps you identify top performers and potential improvement areas.",
          ],
        },
      ],
    },
  },
};
