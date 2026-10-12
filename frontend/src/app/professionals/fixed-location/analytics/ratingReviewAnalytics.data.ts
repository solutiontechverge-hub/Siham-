import type { AnalyticsExplanationContent } from "./analytics.data";

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
  /** Team member this review belongs to (when available from API). */
  memberId?: string;
  memberName?: string;
  reply?: ReviewReply;
};

export type ReviewManagementOverview = {
  title: string;
  description: string;
  explanationLabel: string;
  explanationContent?: AnalyticsExplanationContent;
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
  explanationLabel: string;
  explanationContent?: AnalyticsExplanationContent;
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
  explanationLabel: string;
  explanationContent?: AnalyticsExplanationContent;
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
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "",
          paragraphs: [
            "Exp: Summarises your overall reputation based on the average star rating and total number of client reviews.",
          ],
        },
      ],
    },
    overallRating: 0,
    ratingOutOf: 5,
    totalReviews: 0,
  },
  ratingReviewAnalytics: {
    title: "4.2 Rating & Review Analytics",
    description: "Groups all reviews into bad, good, and excellent bands so you can see how feedback is distributed and which reviews still need a reply.",
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "",
          paragraphs: [
            "Exp: Groups all reviews into bad, good, and excellent bands so you can see how feedback is distributed and which reviews still need a reply.",
          ],
        },
      ],
    },
    rows: [],
  },
  ratingDistributionByCategory: {
    title: "4.3 Rating Distribution by Category",
    description: "Shows how each service category is rated across bad, good, and excellent reviews so you can quickly spot strong areas and categories that may need improvement.",
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "",
          paragraphs: [
            "Exp: Shows how each service category is rated across bad, good, and excellent reviews so you can quickly spot strong areas and categories that may need improvement.",
            "Calculation: Share (%) = (Category Review Count ÷ Total Reviews) × 100. Actions depend on reply status: 'View / Reply' if unreplied, 'View' if all replied, or 'View / Edit' if edits are allowed.",
          ],
        },
      ],
    },
    rows: [],
  },
  reviewSummaryByCategory: {
    title: "Rating & Review Summary by Category",
    maxReviews: 1,
    bars: [],
  },
  reviewsByCategory: {
    Bad: [],
    Good: [],
    Excellent: [],
    "Total Review": [],
  },
};
