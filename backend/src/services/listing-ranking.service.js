import { query } from "../db/index.js";

/** Weights from the listing algorithm spec (must sum to 1). */
export const LISTING_RANKING_WEIGHTS = {
  rating: 0.25,
  reviewCount: 0.25,
  totalSales: 0.2,
  onlineSales: 0.1,
  onlineTransactionCount: 0.1,
  completedOnlineBookings: 0.1,
};

const METRIC_KEYS = Object.keys(LISTING_RANKING_WEIGHTS);
const ONLINE_BOOKING_TYPES = ["online", "request", "project"];
const EXCLUDED_TRANSACTION_STATUSES = ["void", "cancelled", "refunded"];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normalize a metric to 0–1 using min-max across the cohort.
 * When all values are equal, every profile gets a neutral 0.5 contribution.
 */
export const normalizeMetric = (value, min, max) => {
  if (max === min) {
    return 0.5;
  }
  return (value - min) / (max - min);
};

/**
 * Compute weighted ranking scores from raw metrics.
 *
 * @param {Array<{
 *   businessSetupId: string,
 *   rating?: number,
 *   reviewCount?: number,
 *   totalSales?: number,
 *   onlineSales?: number,
 *   onlineTransactionCount?: number,
 *   completedOnlineBookings?: number,
 * }>} metricsList
 */
export const computeRankingScores = (metricsList = []) => {
  if (!metricsList.length) {
    return [];
  }

  const mins = {};
  const maxs = {};

  for (const key of METRIC_KEYS) {
    const values = metricsList.map((item) => toNumber(item[key]));
    mins[key] = Math.min(...values);
    maxs[key] = Math.max(...values);
  }

  return metricsList.map((item) => {
    let rankingScore = 0;

    for (const [key, weight] of Object.entries(LISTING_RANKING_WEIGHTS)) {
      rankingScore +=
        weight * normalizeMetric(toNumber(item[key]), mins[key], maxs[key]);
    }

    return {
      businessSetupId: String(item.businessSetupId),
      rating: toNumber(item.rating),
      reviewCount: toNumber(item.reviewCount),
      totalSales: toNumber(item.totalSales),
      onlineSales: toNumber(item.onlineSales),
      onlineTransactionCount: toNumber(item.onlineTransactionCount),
      completedOnlineBookings: toNumber(item.completedOnlineBookings),
      rankingScore,
    };
  });
};

/**
 * Fetch raw ranking metrics for all active business setups.
 */
export const getRankingMetricsForActiveSetups = async () => {
  const result = await query(
    `SELECT
       bs.id AS business_setup_id,
       bs.updated_at,
       COALESCE(r.avg_rating, 0)::float AS rating,
       COALESCE(r.review_count, 0)::int AS review_count,
       COALESCE(ft.total_sales, 0)::float AS total_sales,
       COALESCE(ft.online_sales, 0)::float AS online_sales,
       COALESCE(ft.online_tx_count, 0)::int AS online_tx_count,
       COALESCE(b.completed_online_bookings, 0)::int AS completed_online_bookings
     FROM business_setups bs
     LEFT JOIN (
       SELECT
         business_setup_id,
         ROUND(AVG(rating)::numeric, 1)::float AS avg_rating,
         COUNT(*)::int AS review_count
       FROM reviews
       WHERE submitted_at IS NOT NULL
       GROUP BY business_setup_id
     ) r ON r.business_setup_id = bs.id
     LEFT JOIN (
       SELECT
         bs2.id AS business_setup_id,
         COALESCE(SUM(ft.net_amount), 0)::float AS total_sales,
         COALESCE(
           SUM(ft.net_amount) FILTER (WHERE ft.entry_type = 'onlineBooking'),
           0
         )::float AS online_sales,
         COUNT(*) FILTER (WHERE ft.entry_type = 'onlineBooking')::int AS online_tx_count
       FROM business_setups bs2
       INNER JOIN finance_transactions ft
         ON ft.professional_profile_id = bs2.professional_profile_id
       WHERE LOWER(COALESCE(ft.status, '')) <> ALL($1::text[])
       GROUP BY bs2.id
     ) ft ON ft.business_setup_id = bs.id
     LEFT JOIN (
       SELECT
         business_setup_id,
         COUNT(*)::int AS completed_online_bookings
       FROM bookings
       WHERE status = 'completed'
         AND booking_type = ANY($2::text[])
       GROUP BY business_setup_id
     ) b ON b.business_setup_id = bs.id
     WHERE bs.is_active = true`,
    [EXCLUDED_TRANSACTION_STATUSES, ONLINE_BOOKING_TYPES],
  );

  return result.rows.map((row) => ({
    businessSetupId: String(row.business_setup_id),
    updatedAt: row.updated_at,
    rating: toNumber(row.rating),
    reviewCount: toNumber(row.review_count),
    totalSales: toNumber(row.total_sales),
    onlineSales: toNumber(row.online_sales),
    onlineTransactionCount: toNumber(row.online_tx_count),
    completedOnlineBookings: toNumber(row.completed_online_bookings),
  }));
};

/**
 * Return active business setups sorted by listing ranking score (desc).
 */
export const getRankedActiveBusinessSetups = async () => {
  const metrics = await getRankingMetricsForActiveSetups();
  const scored = computeRankingScores(metrics);
  const updatedAtBySetupId = new Map(
    metrics.map((item) => [item.businessSetupId, item.updatedAt]),
  );

  return scored.sort((a, b) => {
    const scoreDiff = b.rankingScore - a.rankingScore;
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const updatedA = updatedAtBySetupId.get(a.businessSetupId);
    const updatedB = updatedAtBySetupId.get(b.businessSetupId);
    const timeA = updatedA ? new Date(updatedA).getTime() : 0;
    const timeB = updatedB ? new Date(updatedB).getTime() : 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return b.businessSetupId.localeCompare(a.businessSetupId);
  });
};
