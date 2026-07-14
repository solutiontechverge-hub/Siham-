import type { FlaggedReviewRow } from "./reviewsData";

export const REVIEW_EXPORT_TITLE = "Rating & Review Management — Flagged Reviews";

export const REVIEW_EXPORT_HEADERS = [
  "Professional",
  "Category",
  "Client",
  "Client Type",
  "Rating",
  "Review Text",
  "Date",
  "Time",
] as const;

export function reviewRowToExportRow(review: FlaggedReviewRow): string[] {
  return [
    review.professional,
    review.professionalCategory,
    review.client,
    review.clientType,
    `${review.rating}/5`,
    review.text,
    review.date,
    review.time,
  ];
}

export function buildReviewExportStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function buildReviewExportSubtitle(count: number, stamp = buildReviewExportStamp()) {
  return `Exported on ${stamp} · ${count} review${count === 1 ? "" : "s"}`;
}
