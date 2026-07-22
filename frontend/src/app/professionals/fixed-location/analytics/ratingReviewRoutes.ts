export const RATING_REVIEW_ANALYTICS_TAB = "Rating and Review Analytics";

export const ratingReviewAnalyticsHref = `/professionals/analytics?tab=${encodeURIComponent(RATING_REVIEW_ANALYTICS_TAB)}`;

export type RatingReviewReviewsHrefOptions = {
  memberId?: string;
  memberName?: string;
  /** 1-based team member index; used to match mock "TM N" tags until reviews store real member ids. */
  memberIndex?: number;
};

export function ratingReviewReviewsHref(category: string, options?: RatingReviewReviewsHrefOptions) {
  const params = new URLSearchParams();
  params.set("category", category);
  if (options?.memberId) params.set("memberId", options.memberId);
  if (options?.memberName) params.set("memberName", options.memberName);
  if (options?.memberIndex != null && options.memberIndex > 0) {
    params.set("memberIndex", String(options.memberIndex));
  }
  return `/professionals/fixed-location/analytics/rating-review?${params.toString()}`;
}
