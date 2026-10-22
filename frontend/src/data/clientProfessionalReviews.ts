import type { BusinessPublicProfileCategory, BusinessPublicProfileService } from "./businessPublicProfile.data";

export type ClientReviewReply = {
  authorName: string;
  message: string;
};

export type ClientProfessionalReview = {
  id: string;
  shopId: string;
  memberId: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  tags: Array<{ label: string; categoryId?: string; serviceId?: string }>;
  reply?: ClientReviewReply;
};

export type ReviewFilterServiceGroup = {
  id: string;
  label: string;
  count: number;
  services: Array<{ id: string; label: string }>;
};

export type ReviewFiltersState = {
  allServices: boolean;
  categoryAll: Record<string, boolean>;
  serviceIds: Record<string, boolean>;
  ratings: Record<1 | 2 | 3 | 4 | 5, boolean>;
};

export type ReviewRatingStats = {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export const REVIEWS_CHANGED_EVENT = "mollure:client_reviews_changed";

function reviewKey(shopId: string, memberId: string) {
  return `${shopId}::${memberId}`;
}

export function buildClearedReviewFilters(groups: ReviewFilterServiceGroup[]): ReviewFiltersState {
  const categoryAll: Record<string, boolean> = {};
  const serviceIds: Record<string, boolean> = {};
  for (const group of groups) {
    categoryAll[group.id] = false;
    for (const service of group.services) {
      serviceIds[service.id] = false;
    }
  }
  return {
    allServices: false,
    categoryAll,
    serviceIds,
    ratings: { 5: false, 4: false, 3: false, 2: false, 1: false },
  };
}

/** @deprecated Use buildClearedReviewFilters — filters start cleared (show all reviews). */
export function buildDefaultReviewFilters(groups: ReviewFilterServiceGroup[]): ReviewFiltersState {
  return buildClearedReviewFilters(groups);
}

export function buildReviewFilterGroups(
  categories: BusinessPublicProfileCategory[],
  services: BusinessPublicProfileService[],
): ReviewFilterServiceGroup[] {
  const categoryRows = categories.filter((c) => c.id !== "all");
  return categoryRows.map((category) => {
    const categoryServices = services.filter((s) => s.categoryId === category.id);
    return {
      id: category.id,
      label: category.label,
      count: categoryServices.length,
      services: categoryServices.map((s) => ({ id: s.id, label: s.name })),
    };
  });
}

/** Reviews are stored via /api/reviews — local helpers only for filter/stats utils. */
function loadAll(): ClientProfessionalReview[] {
  return [];
}

function saveAll(_reviews: ClientProfessionalReview[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
}

export function loadReviewsForProfessional(shopId: string, memberId: string): ClientProfessionalReview[] {
  const all = loadAll();
  return sortReviews(all.filter((r) => r.shopId === shopId && r.memberId === memberId));
}

export function loadReviewsForShop(shopId: string): ClientProfessionalReview[] {
  if (!shopId) return [];
  const all = loadAll();
  return sortReviews(all.filter((r) => r.shopId === shopId));
}

export function ensureDemoReviewsForProfessional(
  _shopId: string,
  _memberId: string,
  _services: BusinessPublicProfileService[],
): ClientProfessionalReview[] {
  return [];
}

function sortReviews(reviews: ClientProfessionalReview[]) {
  return [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function computeReviewStats(reviews: ClientProfessionalReview[]): ReviewRatingStats {
  const distribution: ReviewRatingStats["distribution"] = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!reviews.length) {
    return { average: 0, total: 0, distribution };
  }
  let sum = 0;
  for (const review of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += 1;
    sum += review.rating;
  }
  return {
    average: Math.round((sum / reviews.length + Number.EPSILON) * 10) / 10,
    total: reviews.length,
    distribution,
  };
}

function isServiceFilterActive(filters: ReviewFiltersState, groups: ReviewFilterServiceGroup[]): boolean {
  if (filters.allServices) return false;
  const anyCategory = Object.values(filters.categoryAll).some(Boolean);
  const anyService = Object.values(filters.serviceIds).some(Boolean);
  if (!anyCategory && !anyService) return false;
  const allChecked =
    groups.length > 0 &&
    groups.every((group) => filters.categoryAll[group.id] && group.services.every((s) => filters.serviceIds[s.id]));
  return !allChecked;
}

function isRatingFilterActive(filters: ReviewFiltersState): boolean {
  return Object.values(filters.ratings).some(Boolean);
}

export function hasActiveReviewFilters(filters: ReviewFiltersState, groups: ReviewFilterServiceGroup[]): boolean {
  return isServiceFilterActive(filters, groups) || isRatingFilterActive(filters);
}

function reviewMatchesServiceFilters(
  review: ClientProfessionalReview,
  filters: ReviewFiltersState,
  groups: ReviewFilterServiceGroup[],
): boolean {
  const activeServiceIds = new Set(
    Object.entries(filters.serviceIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id),
  );
  const activeCategoryIds = new Set(
    Object.entries(filters.categoryAll)
      .filter(([, checked]) => checked)
      .map(([id]) => id),
  );

  if (!activeServiceIds.size && !activeCategoryIds.size) return true;

  const selectedServiceLabels = new Set<string>();
  for (const group of groups) {
    for (const service of group.services) {
      if (activeServiceIds.has(service.id)) {
        selectedServiceLabels.add(service.label.toLowerCase());
      }
    }
  }

  for (const tag of review.tags) {
    const tagLabel = tag.label.toLowerCase();
    if (tag.serviceId && activeServiceIds.has(tag.serviceId)) return true;
    if (tag.categoryId && activeCategoryIds.has(tag.categoryId)) return true;
    if (selectedServiceLabels.has(tagLabel)) return true;
    for (const group of groups) {
      if (!activeCategoryIds.has(group.id)) continue;
      if (group.services.some((s) => s.label.toLowerCase() === tagLabel)) return true;
    }
  }
  return false;
}

export function filterClientReviews(
  reviews: ClientProfessionalReview[],
  filters: ReviewFiltersState,
  groups: ReviewFilterServiceGroup[],
): ClientProfessionalReview[] {
  const serviceActive = isServiceFilterActive(filters, groups);
  const ratingActive = isRatingFilterActive(filters);

  if (!serviceActive && !ratingActive) return reviews;

  const activeRatings = ratingActive
    ? new Set(
        (Object.entries(filters.ratings) as Array<[string, boolean]>)
          .filter(([, checked]) => checked)
          .map(([rating]) => Number(rating)),
      )
    : null;

  return reviews.filter((review) => {
    if (activeRatings) {
      const bucket = Math.min(5, Math.max(1, Math.round(review.rating)));
      if (!activeRatings.has(bucket)) return false;
    }
    if (serviceActive && !reviewMatchesServiceFilters(review, filters, groups)) return false;
    return true;
  });
}

export function addClientReview(input: Omit<ClientProfessionalReview, "id" | "createdAt">) {
  const review: ClientProfessionalReview = {
    ...input,
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  saveAll([review, ...loadAll()]);
  return review;
}

export function upsertClientReviewReply(reviewId: string, reply: ClientReviewReply | null) {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], reply: reply ?? undefined };
  saveAll(next);
}

export function formatRelativeReviewTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months <= 1) return "1 month ago";
  return `${months} months ago`;
}

export function clientReviewsHref(
  shopId: string,
  memberId?: string,
  options?: { returnTo?: string },
) {
  const params = new URLSearchParams();
  if (memberId) params.set("memberId", memberId);
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  const query = params.toString();
  const base = `/clients/listing/${encodeURIComponent(shopId)}/reviews`;
  return query ? `${base}?${query}` : base;
}

/** Only allow same-app relative paths (blocks open redirects). */
export function resolveReviewsBackHref(
  shopId: string,
  returnTo?: string | null,
): string {
  const fallback = `/clients/listing/${encodeURIComponent(shopId)}`;
  if (!returnTo) return fallback;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return fallback;
  return returnTo;
}
