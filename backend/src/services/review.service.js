import crypto from "crypto";
import { query } from "../db/index.js";
import { emitReviewChanged } from "../messaging/messagingSocket.js";

const INVITE_TTL_DAYS = Number(process.env.REVIEW_INVITE_TTL_DAYS || 14);

const mapReviewRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    businessSetupId: row.business_setup_id,
    teamMemberId: row.team_member_id,
    teamMemberName: row.team_member_name || null,
    clientUserId: row.client_user_id,
    bookingId: row.booking_id,
    serviceId: row.service_id,
    serviceName: row.service_name || null,
    rating: row.rating == null ? null : Number(row.rating),
    body: row.body || null,
    reviewerDisplayName: row.reviewer_display_name || null,
    reply: row.reply_text
      ? {
          message: row.reply_text,
          authorName: row.reply_author_name || "Professional",
          repliedAt: row.replied_at,
        }
      : null,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    salonName: row.salon_name || null,
    inviteExpiresAt: row.invite_expires_at || null,
  };
};

export async function createReviewInviteForBooking(bookingId) {
  if (!bookingId) return null;

  const existing = await query(
    `SELECT id, invite_token, submitted_at
     FROM reviews
     WHERE booking_id = $1
     LIMIT 1`,
    [bookingId],
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const bookingResult = await query(
    `SELECT
       b.id,
       b.business_setup_id,
       b.team_member_id,
       b.customer_id,
       b.service_id,
       b.status,
       COALESCE(
         NULLIF(TRIM(COALESCE(ip.display_name, CONCAT_WS(' ', ip.first_name, ip.last_name))), ''),
         NULLIF(TRIM(COALESCE(cp.company_name, '')), ''),
         u.email
       ) AS reviewer_display_name
     FROM bookings b
     INNER JOIN users u ON u.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId],
  );

  const booking = bookingResult.rows[0];
  if (!booking || booking.status !== "completed") {
    return null;
  }
  if (!booking.customer_id || !booking.business_setup_id) {
    return null;
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const inserted = await query(
    `INSERT INTO reviews (
       business_setup_id,
       team_member_id,
       client_user_id,
       booking_id,
       service_id,
       reviewer_display_name,
       invite_token,
       invite_expires_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (booking_id) DO NOTHING
     RETURNING id, invite_token, submitted_at`,
    [
      booking.business_setup_id,
      booking.team_member_id,
      booking.customer_id,
      booking.id,
      booking.service_id,
      booking.reviewer_display_name,
      inviteToken,
      expiresAt.toISOString(),
    ],
  );

  if (inserted.rows[0]) {
    return inserted.rows[0];
  }

  const again = await query(
    `SELECT id, invite_token, submitted_at FROM reviews WHERE booking_id = $1 LIMIT 1`,
    [bookingId],
  );
  return again.rows[0] || null;
}

export async function getReviewInviteByToken(token) {
  const result = await query(
    `SELECT
       r.*,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Salon') AS salon_name,
       COALESCE(NULLIF(tm.full_name, ''), 'Your professional') AS team_member_name,
       COALESCE(NULLIF(sc.title, ''), 'Service') AS service_name
     FROM reviews r
     INNER JOIN business_setups bs ON bs.id = r.business_setup_id
     LEFT JOIN business_team_members tm ON tm.id = r.team_member_id
     LEFT JOIN subcategories sc ON sc.id = r.service_id
     WHERE r.invite_token = $1
     LIMIT 1`,
    [token],
  );
  return mapReviewRow(result.rows[0]);
}

export async function submitReviewByToken(token, { rating, body }) {
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    const error = new Error("Rating must be an integer between 1 and 5.");
    error.statusCode = 400;
    throw error;
  }

  const reviewText = String(body ?? "").trim();
  if (reviewText.length < 3) {
    const error = new Error("Review text must be at least 3 characters.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await query(
    `SELECT * FROM reviews WHERE invite_token = $1 LIMIT 1`,
    [token],
  );
  const row = existing.rows[0];
  if (!row) {
    const error = new Error("Review invite not found.");
    error.statusCode = 404;
    throw error;
  }
  if (row.submitted_at) {
    const error = new Error("This review has already been submitted.");
    error.statusCode = 409;
    throw error;
  }
  if (row.invite_expires_at && new Date(row.invite_expires_at).getTime() < Date.now()) {
    const error = new Error("This review invite has expired.");
    error.statusCode = 410;
    throw error;
  }

  const updated = await query(
    `UPDATE reviews
     SET rating = $2,
         body = $3,
         submitted_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 AND submitted_at IS NULL
     RETURNING *`,
    [row.id, numericRating, reviewText],
  );

  const review = mapReviewRow(updated.rows[0]);
  if (review) {
    emitReviewChanged({
      action: "submitted",
      reviewId: review.id,
      business_setup_id: review.businessSetupId,
      team_member_id: review.teamMemberId,
      client_user_id: review.clientUserId,
    });
  }
  return review;
}

export async function listSubmittedReviews({
  businessSetupId,
  teamMemberId = null,
  limit = 100,
}) {
  if (!businessSetupId) return [];

  const params = [businessSetupId];
  let memberClause = "";
  if (teamMemberId) {
    params.push(teamMemberId);
    memberClause = ` AND r.team_member_id = $${params.length}`;
  }
  params.push(Math.min(Math.max(Number(limit) || 100, 1), 200));

  const result = await query(
    `SELECT
       r.*,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Salon') AS salon_name,
       COALESCE(NULLIF(tm.full_name, ''), NULL) AS team_member_name,
       COALESCE(NULLIF(sc.title, ''), NULL) AS service_name
     FROM reviews r
     INNER JOIN business_setups bs ON bs.id = r.business_setup_id
     LEFT JOIN business_team_members tm ON tm.id = r.team_member_id
     LEFT JOIN subcategories sc ON sc.id = r.service_id
     WHERE r.business_setup_id = $1
       AND r.submitted_at IS NOT NULL
       ${memberClause}
     ORDER BY r.submitted_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return result.rows.map(mapReviewRow);
}

export async function getReviewStats({ businessSetupId, teamMemberId = null }) {
  if (!businessSetupId) {
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const params = [businessSetupId];
  let memberClause = "";
  if (teamMemberId) {
    params.push(teamMemberId);
    memberClause = ` AND team_member_id = $${params.length}`;
  }

  const result = await query(
    `SELECT
       COUNT(*)::int AS total,
       COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average,
       COUNT(*) FILTER (WHERE rating = 5)::int AS star5,
       COUNT(*) FILTER (WHERE rating = 4)::int AS star4,
       COUNT(*) FILTER (WHERE rating = 3)::int AS star3,
       COUNT(*) FILTER (WHERE rating = 2)::int AS star2,
       COUNT(*) FILTER (WHERE rating = 1)::int AS star1
     FROM reviews
     WHERE business_setup_id = $1
       AND submitted_at IS NOT NULL
       ${memberClause}`,
    params,
  );

  const row = result.rows[0] || {};
  return {
    average: Number(row.average) || 0,
    total: Number(row.total) || 0,
    distribution: {
      5: Number(row.star5) || 0,
      4: Number(row.star4) || 0,
      3: Number(row.star3) || 0,
      2: Number(row.star2) || 0,
      1: Number(row.star1) || 0,
    },
  };
}

export async function getReviewAggregatesForSetups(setupIds = []) {
  if (!setupIds.length) return new Map();

  const result = await query(
    `SELECT
       business_setup_id,
       COUNT(*)::int AS total,
       COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average
     FROM reviews
     WHERE business_setup_id = ANY($1::uuid[])
       AND submitted_at IS NOT NULL
     GROUP BY business_setup_id`,
    [setupIds],
  );

  const map = new Map();
  for (const row of result.rows) {
    map.set(String(row.business_setup_id), {
      rating: Number(row.average) || 0,
      totalReviews: Number(row.total) || 0,
    });
  }
  return map;
}

export async function getTeamMemberReviewAggregates(setupId) {
  if (!setupId) return new Map();
  const bySetup = await getTeamMemberReviewAggregatesForSetups([setupId]);
  return bySetup.get(String(setupId)) ?? new Map();
}

/** @returns {Map<string, Map<string, { rating: number, totalReviews: number }>>} setupId -> memberId -> stats */
export async function getTeamMemberReviewAggregatesForSetups(setupIds = []) {
  if (!setupIds.length) return new Map();

  const result = await query(
    `SELECT
       business_setup_id,
       team_member_id,
       COUNT(*)::int AS total,
       COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average
     FROM reviews
     WHERE business_setup_id = ANY($1::uuid[])
       AND submitted_at IS NOT NULL
       AND team_member_id IS NOT NULL
     GROUP BY business_setup_id, team_member_id`,
    [setupIds],
  );

  const bySetup = new Map();
  for (const row of result.rows) {
    const setupKey = String(row.business_setup_id);
    if (!bySetup.has(setupKey)) bySetup.set(setupKey, new Map());
    bySetup.get(setupKey).set(String(row.team_member_id), {
      rating: Number(row.average) || 0,
      totalReviews: Number(row.total) || 0,
    });
  }
  return bySetup;
}

async function assertProfessionalOwnsReview(userId, reviewId) {
  const result = await query(
    `SELECT
       r.*,
       pp.user_id AS professional_user_id
     FROM reviews r
     INNER JOIN business_setups bs ON bs.id = r.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE r.id = $1
     LIMIT 1`,
    [reviewId],
  );

  const row = result.rows[0];
  if (!row) {
    const error = new Error("Review not found.");
    error.statusCode = 404;
    throw error;
  }
  if (String(row.professional_user_id) !== String(userId)) {
    const error = new Error("You can only reply to reviews for your own clients.");
    error.statusCode = 403;
    throw error;
  }
  if (!row.submitted_at) {
    const error = new Error("Cannot reply before the client submits a review.");
    error.statusCode = 400;
    throw error;
  }
  return row;
}

export async function replyToReview(userId, reviewId, { message, authorName }) {
  const replyText = String(message ?? "").trim();
  if (!replyText) {
    const error = new Error("Reply message is required.");
    error.statusCode = 400;
    throw error;
  }

  await assertProfessionalOwnsReview(userId, reviewId);

  const updated = await query(
    `UPDATE reviews
     SET reply_text = $2,
         reply_author_name = $3,
         replied_at = NOW(),
         replied_by_user_id = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [reviewId, replyText, authorName || "Professional", userId],
  );

  const review = mapReviewRow(updated.rows[0]);
  if (review) {
    emitReviewChanged({
      action: "replied",
      reviewId: review.id,
      business_setup_id: review.businessSetupId,
      team_member_id: review.teamMemberId,
      client_user_id: review.clientUserId,
    });
  }
  return review;
}

export async function deleteReviewReply(userId, reviewId) {
  await assertProfessionalOwnsReview(userId, reviewId);

  const updated = await query(
    `UPDATE reviews
     SET reply_text = NULL,
         reply_author_name = NULL,
         replied_at = NULL,
         replied_by_user_id = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [reviewId],
  );

  const review = mapReviewRow(updated.rows[0]);
  if (review) {
    emitReviewChanged({
      action: "reply_deleted",
      reviewId: review.id,
      business_setup_id: review.businessSetupId,
      team_member_id: review.teamMemberId,
      client_user_id: review.clientUserId,
    });
  }
  return review;
}
