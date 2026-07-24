import type { FlaggedReviewRow, ReviewTabId } from "../../reviewsData";
import type { ratingCategoryDefaults } from "../../adminMockData";

export type AdminReviewsPageProps = {
  embedded?: boolean;
};

export type RatingRanges = typeof ratingCategoryDefaults;

export type {
  FlaggedReviewRow,
  ReviewTabId,
};
