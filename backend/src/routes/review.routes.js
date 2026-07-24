import express from "express";
import { body } from "express-validator";
import {
  createReviewReply,
  getReviewInvite,
  listReviews,
  removeReviewReply,
  submitReviewInvite,
} from "../controllers/review.controller.js";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get("/invite/:token", getReviewInvite);
router.post(
  "/invite/:token",
  [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5."),
    body("body").trim().isLength({ min: 3 }).withMessage("body must be at least 3 characters."),
  ],
  validateRequest,
  submitReviewInvite,
);

router.get("/", authenticateUser, listReviews);

router.post(
  "/:id/reply",
  authenticateUser,
  authorizeRoles("professional"),
  [body("message").trim().isLength({ min: 1 }).withMessage("message is required.")],
  validateRequest,
  createReviewReply,
);

router.delete(
  "/:id/reply",
  authenticateUser,
  authorizeRoles("professional"),
  removeReviewReply,
);

export default router;
