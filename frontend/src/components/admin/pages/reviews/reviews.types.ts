import type { FlaggedReviewRow, ReviewTabId } from "../../reviewsData";
import { ratingCategoryDefaults } from "../../adminMockData";

export type AdminReviewsPageProps = {
  embedded?: boolean;
};

export type RatingRanges = typeof ratingCategoryDefaults;

export type {
  FlaggedReviewRow,
  ReviewTabId,
};
