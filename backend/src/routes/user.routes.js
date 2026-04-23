import express from "express";
import { body } from "express-validator";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/profile", authenticateUser, getProfile);

router.put(
  "/profile",
  authenticateUser,
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  [
    body("email")
      .optional({ values: "falsy" })
      .trim()
      .isEmail()
      .withMessage("email must be a valid email address.")
      .normalizeEmail(),
    body("password")
      .optional({ values: "falsy" })
      .isLength({ min: 8 })
      .withMessage("password must be at least 8 characters long."),
    body("confirm_password")
      .optional({ values: "falsy" })
      .custom((value, { req }) => !req.body.password || value === req.body.password)
      .withMessage("confirm_password must match password."),
    body("website")
      .optional({ values: "falsy" })
      .isURL()
      .withMessage("website must be a valid URL."),
    body("other_link")
      .optional({ values: "falsy" })
      .isURL()
      .withMessage("other_link must be a valid URL."),
    body("experience_years")
      .optional({ values: "falsy" })
      .isInt({ min: 0 })
      .withMessage("experience_years must be a non-negative integer."),
  ],
  validateRequest,
  updateProfile,
);

export default router;
