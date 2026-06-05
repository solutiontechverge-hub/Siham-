export type ReviewTag = {
  label: string;
};

export type ReviewReply = {
  authorName: string;
  message: string;
};

export type ProfessionalReviewItem = {
  id: string;
  reviewerName: string;
  relativeTimeLabel: string;
  rating: number; // 0..5
  reviewText: string;
  tags: readonly ReviewTag[];
  reply?: ReviewReply;
};

export type ReviewManagementOverview = {
  title: string;
  description: string;
  overallRating: number;
  ratingOutOf: number;
  totalReviews: number;
};

export type RatingAnalyticsRow = {
  category: string;
  range: string;
  count: number;
  sharePct: number;
  repliedTo: number;
  isTotal?: boolean;
};

export type RatingReviewAnalytics = {
  title: string;
  description: string;
  rows: readonly RatingAnalyticsRow[];
};

export type RatingDistributionRow = {
  category: string;
  badPct: number;
  goodPct: number;
  excellentPct: number;
  totalReviews: number;
  isTotal?: boolean;
};

export type RatingDistributionByCategory = {
  title: string;
  description: string;
  rows: readonly RatingDistributionRow[];
};

export type ReviewSummaryBar = {
  category: string;
  totalReviews: number;
  badPct: number;
  goodPct: number;
  excellentPct: number;
};

export type ReviewSummaryByCategory = {
  title: string;
  bars: readonly ReviewSummaryBar[];
  maxReviews: number;
};

export type ProfessionalFixedLocationRatingReviewAnalyticsData = {
  reviewManagementOverview: ReviewManagementOverview;
  ratingReviewAnalytics: RatingReviewAnalytics;
  ratingDistributionByCategory: RatingDistributionByCategory;
  reviewSummaryByCategory: ReviewSummaryByCategory;
  /** Keyed by the category label (e.g. "Bad", "Good", "Excellent", "Total Review") */
  reviewsByCategory: Record<string, readonly ProfessionalReviewItem[]>;
};

export const professionalFixedLocationRatingReviewAnalyticsData: ProfessionalFixedLocationRatingReviewAnalyticsData = {
  reviewManagementOverview: {
    title: "4.1 Review Management Overview",
    description: "Summarises your overall reputation based on the average star rating and total number of client reviews.",
    overallRating: 4.5,
    ratingOutOf: 5.0,
    totalReviews: 54,
  },
  ratingReviewAnalytics: {
    title: "4.2 Rating & Review Analytics",
    description: "Groups all reviews into bad, good, and excellent bands so you can see how feedback is distributed and which reviews still need a reply.",
    rows: [
      { category: "Bad",          range: "1.0 – 3.0", count: 30, sharePct: 10, repliedTo: 90 },
      { category: "Good",         range: "3.5 – 4.0", count: 20, sharePct: 5,  repliedTo: 60 },
      { category: "Excellent",    range: "4.5 – 5.0", count: 20, sharePct: 5,  repliedTo: 60 },
      { category: "Total Review", range: "—",          count: 50, sharePct: 15, repliedTo: 150, isTotal: true },
    ],
  },
  ratingDistributionByCategory: {
    title: "4.3 Rating Distribution by Category",
    description: "Shows how each service category is rated across bad, good, and excellent reviews so you can quickly spot strong areas and categories that may need improvement.",
    rows: [
      { category: "Hair",      badPct: 30, goodPct: 30, excellentPct: 10, totalReviews: 90 },
      { category: "Nails",     badPct: 20, goodPct: 20, excellentPct: 5,  totalReviews: 60 },
      { category: "Makeup",    badPct: 20, goodPct: 20, excellentPct: 5,  totalReviews: 60 },
      { category: "Brows",     badPct: 20, goodPct: 20, excellentPct: 5,  totalReviews: 60 },
      { category: "EyeLashes", badPct: 20, goodPct: 20, excellentPct: 5,  totalReviews: 60 },
      { category: "Total (Weighted Avg.)", badPct: 50, goodPct: 50, excellentPct: 15, totalReviews: 150, isTotal: true },
    ],
  },
  reviewSummaryByCategory: {
    title: "Rating & Review Summary by Category",
    maxReviews: 30,
    bars: [
      { category: "Body Treatment", totalReviews: 20, badPct: 5,  goodPct: 25, excellentPct: 70 },
      { category: "Brows",          totalReviews: 15, badPct: 37, goodPct: 33, excellentPct: 30 },
      { category: "EyeLashes",      totalReviews: 25, badPct: 37, goodPct: 43, excellentPct: 20 },
      { category: "Nails",          totalReviews: 15, badPct: 37, goodPct: 33, excellentPct: 30 },
      { category: "Makeup",         totalReviews: 20, badPct: 37, goodPct: 33, excellentPct: 30 },
    ],
  },
  reviewsByCategory: {
    Bad: [
      { id: "bad_1", reviewerName: "Alex Turner", relativeTimeLabel: "3 days ago", rating: 2, reviewText: "Not great — waited 30 minutes past my appointment time and the result wasn't what I asked for. Very disappointing.", tags: [{ label: "TM 1" }, { label: "Nails" }] },
      { id: "bad_2", reviewerName: "Maria Gomez", relativeTimeLabel: "1 week ago", rating: 1.5, reviewText: "The service was rushed and the quality was below average. Won't be coming back.", tags: [{ label: "TM 2" }, { label: "Makeup" }] },
    ],
    Good: [
      { id: "good_1", reviewerName: "Jamie Lee", relativeTimeLabel: "2 days ago", rating: 3.8, reviewText: "Decent experience overall. The stylist was friendly but the finish could use more attention to detail.", tags: [{ label: "TM 1" }, { label: "Haircut" }], reply: { authorName: "Micheal", message: "Thank you for the feedback Jamie! We will work on improving our attention to detail." } },
      { id: "good_2", reviewerName: "Nina Patel", relativeTimeLabel: "5 days ago", rating: 4.0, reviewText: "Good service and pleasant environment. Booking was easy and the team was professional.", tags: [{ label: "TM 2" }, { label: "Blowdry" }] },
    ],
    Excellent: [
      { id: "exc_1", reviewerName: "Sara Johnson", relativeTimeLabel: "1 week ago", rating: 5, reviewText: "Jessica is an absolute artist! She took the time to listen to what I wanted and gave me the best haircut I've had in years. The salon has such a relaxing atmosphere. I'll definitely be back!", tags: [{ label: "TM 1" }, { label: "Haircut" }, { label: "Blowdry" }, { label: "TM 2" }, { label: "Haircut" }, { label: "Blowdry" }], reply: { authorName: "Micheal", message: "Thank you, Sarah! So glad you loved your hair. We hope to see you again soon for your next event!" } },
      { id: "exc_2", reviewerName: "Sara Johnson", relativeTimeLabel: "1 week ago", rating: 5, reviewText: "Jessica is an absolute artist! She took the time to listen to what I wanted and gave me the best haircut I've had in years. The salon has such a relaxing atmosphere. I'll definitely be back!", tags: [{ label: "TM 1" }, { label: "Haircut" }, { label: "Blowdry" }, { label: "TM 2" }, { label: "Haircut" }, { label: "Blowdry" }], reply: { authorName: "Micheal", message: "Thank you, Sarah! So glad you loved your hair. We hope to see you again soon for your next event!" } },
    ],
    "Total Review": [
      { id: "bad_1", reviewerName: "Alex Turner", relativeTimeLabel: "3 days ago", rating: 2, reviewText: "Not great — waited 30 minutes past my appointment time.", tags: [{ label: "TM 1" }, { label: "Nails" }] },
      { id: "good_1", reviewerName: "Jamie Lee", relativeTimeLabel: "2 days ago", rating: 3.8, reviewText: "Decent experience overall.", tags: [{ label: "TM 1" }, { label: "Haircut" }], reply: { authorName: "Micheal", message: "Thank you for the feedback Jamie!" } },
      { id: "exc_1", reviewerName: "Sara Johnson", relativeTimeLabel: "1 week ago", rating: 5, reviewText: "Jessica is an absolute artist! Best haircut I've had in years.", tags: [{ label: "TM 1" }, { label: "Haircut" }, { label: "Blowdry" }], reply: { authorName: "Micheal", message: "Thank you, Sarah!" } },
    ],
  },
};
