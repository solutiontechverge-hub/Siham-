import express from "express";
import { body, param } from "express-validator";
import {
  createReviewReply,
  getReviewInvite,
  getBookingReviewInvite,
  listReviews,
  removeReviewReply,
  submitReviewInvite,
} from "../controllers/review.controller.js";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { LIMITS, textBody, uuidParam } from "../validators/fields.js";

const router = express.Router();

router.get(
  "/invite/:token",
  [
    param("token")
      .trim()
      .isLength({ min: 8, max: 256 })
      .withMessage("token format is invalid."),
  ],
  validateRequest,
  getReviewInvite,
);
router.post(
  "/invite/:token",
  [
    param("token")
      .trim()
      .isLength({ min: 8, max: 256 })
      .withMessage("token format is invalid."),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5."),
    textBody("body", {
      min: LIMITS.reviewBodyMin,
      max: LIMITS.reviewBodyMax,
      label: "body",
    }),
  ],
  validateRequest,
  submitReviewInvite,
);

// Public read — clients browse ratings without being forced through login redirect
router.get("/", listReviews);

router.get(
  "/booking/:bookingId/invite",
  authenticateUser,
  [uuidParam("bookingId")],
  validateRequest,
  getBookingReviewInvite,
);

router.post(
  "/:id/reply",
  authenticateUser,
  authorizeRoles("professional"),
  [
    uuidParam("id"),
    textBody("message", {
      min: 1,
      max: LIMITS.messageMax,
      label: "message",
    }),
  ],
  validateRequest,
  createReviewReply,
);

router.delete(
  "/:id/reply",
  authenticateUser,
  authorizeRoles("professional"),
  [uuidParam("id")],
  validateRequest,
  removeReviewReply,
);

export default router;
