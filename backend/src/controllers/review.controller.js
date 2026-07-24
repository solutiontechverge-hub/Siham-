import {
  deleteReviewReply,
  getReviewInviteByToken,
  getReviewStats,
  listSubmittedReviews,
  replyToReview,
  submitReviewByToken,
} from "../services/review.service.js";

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
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load review invite.",
      data: null,
    });
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to submit review.",
      data: null,
    });
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
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reviews.",
      data: null,
    });
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to save reply.",
      data: null,
    });
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete reply.",
      data: null,
    });
  }
};
