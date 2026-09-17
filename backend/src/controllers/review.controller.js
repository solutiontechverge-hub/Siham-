import {
  createReviewInviteForBooking,
  deleteReviewReply,
  getReviewInviteByToken,
  getReviewStats,
  listSubmittedReviews,
  replyToReview,
  submitReviewByToken,
} from "../services/review.service.js";
import { query } from "../db/index.js";
import { sendCaughtError } from "../utils/httpError.js";

export const getReviewInvite = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    const invite = await getReviewInviteByToken(token);
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Review invite not found.",
        data: null,
      });
    }

    const expired =
      invite.inviteExpiresAt &&
      new Date(invite.inviteExpiresAt).getTime() < Date.now();

    return res.status(200).json({
      success: true,
      message: "Review invite loaded.",
      data: {
        ...invite,
        expired: Boolean(expired),
        alreadySubmitted: Boolean(invite.submittedAt),
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to load review invite." });
  }
};

export const submitReviewInvite = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    const review = await submitReviewByToken(token, {
      rating: req.body?.rating,
      body: req.body?.body,
    });
    return res.status(200).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to submit review." });
  }
};

/** Client-owned completed booking → review invite token (create if missing). */
export const getBookingReviewInvite = async (req, res) => {
  try {
    const bookingId = String(req.params.bookingId || "").trim();
    const userId = req.user?.id;
    if (!bookingId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Booking id is required.",
        data: null,
      });
    }

    const bookingResult = await query(
      `SELECT id, customer_id, status
       FROM bookings
       WHERE id = $1
       LIMIT 1`,
      [bookingId],
    );
    const booking = bookingResult.rows[0];
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
        data: null,
      });
    }
    if (String(booking.customer_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own bookings.",
        data: null,
      });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Reviews are available after the booking is completed.",
        data: null,
      });
    }

    await createReviewInviteForBooking(bookingId);

    const inviteResult = await query(
      `SELECT invite_token, submitted_at, invite_expires_at
       FROM reviews
       WHERE booking_id = $1
       LIMIT 1`,
      [bookingId],
    );
    const invite = inviteResult.rows[0];
    if (!invite?.invite_token) {
      return res.status(500).json({
        success: false,
        message: "Could not create a review invite for this booking.",
        data: null,
      });
    }

    const expired =
      invite.invite_expires_at &&
      new Date(invite.invite_expires_at).getTime() < Date.now();

    return res.status(200).json({
      success: true,
      message: "Review invite ready.",
      data: {
        inviteToken: invite.invite_token,
        alreadySubmitted: Boolean(invite.submitted_at),
        expired: Boolean(expired),
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to load review invite." });
  }
};

export const listReviews = async (req, res) => {
  try {
    const businessSetupId = String(req.query.businessSetupId || "").trim();
    if (!businessSetupId) {
      return res.status(400).json({
        success: false,
        message: "businessSetupId is required.",
        data: null,
      });
    }

    const teamMemberId = String(req.query.teamMemberId || "").trim() || null;
    const [reviews, stats] = await Promise.all([
      listSubmittedReviews({ businessSetupId, teamMemberId }),
      getReviewStats({ businessSetupId, teamMemberId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully.",
      data: { reviews, stats },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to fetch reviews." });
  }
};

export const createReviewReply = async (req, res) => {
  try {
    const reviewId = String(req.params.id || "").trim();
    const authorName =
      String(req.body?.authorName || "").trim() ||
      req.user?.email ||
      "Professional";

    const review = await replyToReview(req.user.id, reviewId, {
      message: req.body?.message,
      authorName,
    });

    return res.status(200).json({
      success: true,
      message: "Reply saved.",
      data: review,
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to save reply." });
  }
};

export const removeReviewReply = async (req, res) => {
  try {
    const reviewId = String(req.params.id || "").trim();
    const review = await deleteReviewReply(req.user.id, reviewId);
    return res.status(200).json({
      success: true,
      message: "Reply deleted.",
      data: review,
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to delete reply." });
  }
};
