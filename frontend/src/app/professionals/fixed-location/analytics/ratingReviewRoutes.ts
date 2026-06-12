export const RATING_REVIEW_ANALYTICS_TAB = "Rating and Review Analytics";

export const ratingReviewAnalyticsHref = `/professionals/analytics?tab=${encodeURIComponent(RATING_REVIEW_ANALYTICS_TAB)}`;

export function ratingReviewReviewsHref(category: string) {
  return `/professionals/fixed-location/analytics/rating-review?category=${encodeURIComponent(category)}`;
}
