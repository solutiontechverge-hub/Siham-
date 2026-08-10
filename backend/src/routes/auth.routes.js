import express from "express";
import { body } from "express-validator";
import {
  forgotPassword,
  login,
  refreshSession,
  register,
  resetPassword,
  selectUserType,
  verifyEmail,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { loginWithApple, loginWithGoogle } from "../controllers/oauth.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { optionalOtherLink, optionalWebsite } from "../validators/optionalWebUrl.js";

const router = express.Router();
const userTypes = ["individual", "company", "professional"];

router.post(
  "/select-user-type",
  body("user_type")
    .trim()
    .isIn(userTypes)
    .withMessage("user_type must be one of individual, company, or professional."),
  validateRequest,
  selectUserType,
);

router.post(
  "/register",
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  [
    body("user_type")
      .trim()
      .isIn(userTypes)
      .withMessage("user_type must be one of individual, company, or professional."),
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long."),
    body("confirm_password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("confirm_password must match password."),
    optionalWebsite(),
    optionalOtherLink(),
    body("experience_years")
      .optional({ values: "falsy" })
      .isInt({ min: 0 })
      .withMessage("experience_years must be a non-negative integer."),
  ],
  validateRequest,
  register,
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
    body("remember").optional().isBoolean().withMessage("remember must be a boolean."),
  ],
  validateRequest,
  login,
);

router.post(
  "/refresh",
  [
    body("refresh_token").isString().notEmpty().withMessage("refresh_token is required."),
    body("remember").optional().isBoolean().withMessage("remember must be a boolean."),
  ],
  validateRequest,
  refreshSession,
);

router.post(
  "/google",
  body("id_token").isString().notEmpty().withMessage("id_token is required."),
  validateRequest,
  loginWithGoogle,
);

router.post(
  "/apple",
  [
    body("id_token").isString().notEmpty().withMessage("id_token is required."),
    body("first_name").optional().isString().trim(),
    body("last_name").optional().isString().trim(),
  ],
  validateRequest,
  loginWithApple,
);

router.post(
  "/forgot-password",
  body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
  validateRequest,
  forgotPassword,
);

router.post(
  "/verify-otp",
  [
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("otp")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("otp must be a 6-digit code."),
  ],
  validateRequest,
  verifyOtp,
);

router.post(
  "/reset-password",
  [
    body("user_id").isInt({ min: 1 }).withMessage("user_id must be a valid integer."),
    body("new_password")
      .isLength({ min: 8 })
      .withMessage("new_password must be at least 8 characters long."),
    body("confirm_password")
      .custom((value, { req }) => value === req.body.new_password)
      .withMessage("confirm_password must match new_password."),
  ],
  validateRequest,
  resetPassword,
);

router.post(
  "/verify-email",
  body("token").optional().isString().withMessage("token must be a valid string."),
  validateRequest,
  verifyEmail,
);

router.get("/verify-email", verifyEmail);

export default router;
