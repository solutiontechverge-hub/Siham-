export function formatTeamMemberReviewsLabel(totalReviews: number): string {
  if (!Number.isFinite(totalReviews) || totalReviews <= 0) {
    return "No reviews yet";
  }
  return `(${totalReviews} Review${totalReviews === 1 ? "" : "s"})`;
}

export function teamMemberRatingFromApi(
  rating: number | null | undefined,
  totalReviews: number | null | undefined,
): { rating: number; reviewsLabel: string } {
  const count = Number(totalReviews) || 0;
  const value = count > 0 ? Number(rating) || 0 : 0;
  return {
    rating: value,
    reviewsLabel: formatTeamMemberReviewsLabel(count),
  };
}
