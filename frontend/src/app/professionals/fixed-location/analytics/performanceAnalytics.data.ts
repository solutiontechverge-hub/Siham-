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
    explanationText: string;
  };
};

export const professionalFixedLocationPerformanceAnalyticsData: ProfessionalFixedLocationPerformanceAnalyticsData = {
  productivityAndEfficiency: {
    title: "3.1 Productivity & Efficiency",
    rows: [
      {
        teamMember: "Sarah",
        hoursWorked: 120,
        completedBookings: 45,
        revenueEur: 10200,
        productivityEurPerHr: 85.0,
        efficiencyPct: 92,
        averageRating: 92,
        reviews: 92,
      },
      {
        teamMember: "Emma",
        hoursWorked: 95,
        completedBookings: 40,
        revenueEur: 8200,
        productivityEurPerHr: 82.0,
        efficiencyPct: 88,
        averageRating: 88,
        reviews: 88,
      },
      {
        teamMember: "Alex",
        hoursWorked: 80,
        completedBookings: 38,
        revenueEur: 7900,
        productivityEurPerHr: 87.7,
        efficiencyPct: 90,
        averageRating: 90,
        reviews: 90,
      },
      {
        teamMember: "Team Average",
        hoursWorked: 200,
        completedBookings: 41,
        revenueEur: 8767,
        productivityEurPerHr: 84.9,
        efficiencyPct: 90,
        averageRating: 90,
        reviews: 90,
        isAverage: true,
      },
    ],
    explanationLabel: "View Explanation",
    explanationText:
      "Productivity shows how much revenue each team member generates per hour worked, while efficiency reflects how consistently they complete the bookings they handle. This helps you identify top performers and potential improvement areas.",
  },
};

