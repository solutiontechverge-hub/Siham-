import express from "express";
import { body } from "express-validator";
import {
  changePassword,
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
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validateImageUploadContent } from "../middleware/validateUploadContent.middleware.js";
import { optionalOtherLink, optionalWebsite } from "../validators/optionalWebUrl.js";
import {
  cocBody,
  emailBody,
  otpBody,
  passwordBody,
  personNameBody,
  textBody,
  vatBody,
  LIMITS,
} from "../validators/fields.js";

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
  validateImageUploadContent,
  [
    body("user_type")
      .trim()
      .isIn(userTypes)
      .withMessage("user_type must be one of individual, company, or professional."),
    emailBody("email"),
    passwordBody("password"),
    body("confirm_password")
      .isString()
      .withMessage("confirm_password must be a string.")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("confirm_password must match password."),
    personNameBody("first_name", { optional: true, label: "first_name" }),
    personNameBody("last_name", { optional: true, label: "last_name" }),
    personNameBody("contact_first_name", {
      optional: true,
      label: "contact_first_name",
    }),
    personNameBody("contact_last_name", {
      optional: true,
      label: "contact_last_name",
    }),
    textBody("legal_name", {
      optional: true,
      max: LIMITS.personName,
      label: "legal_name",
    }),
    textBody("display_name", {
      optional: true,
      max: LIMITS.personName,
      label: "display_name",
    }),
    cocBody("ccc_number", { optional: true }),
    vatBody("vat_number", { optional: true }),
    textBody("street", { optional: true, max: LIMITS.textShort }),
    textBody("street_number", { optional: true, max: 20 }),
    textBody("postal_code", { optional: true, max: 12 }),
    textBody("province", { optional: true, max: LIMITS.textShort }),
    textBody("municipality", { optional: true, max: LIMITS.textShort }),
    textBody("gender", { optional: true, max: 32 }),
    textBody("country_code", { optional: true, max: 8 }),
    textBody("phone", { optional: true, max: LIMITS.phone }),
    textBody("business_type", { optional: true, max: 64 }),
    textBody("instagram", { optional: true, max: LIMITS.textShort }),
    body("date_of_birth")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date_of_birth must be YYYY-MM-DD."),
    optionalWebsite(),
    optionalOtherLink(),
    body("experience_years")
      .optional({ values: "falsy" })
      .isInt({ min: 0, max: 80 })
      .withMessage("experience_years must be an integer 0–80."),
  ],
  validateRequest,
  register,
);

router.post(
  "/login",
  [
    emailBody("email"),
    passwordBody("password"),
    body("remember").optional().isBoolean().withMessage("remember must be a boolean."),
  ],
  validateRequest,
  login,
);

router.post(
  "/refresh",
  [
    body("refresh_token")
      .isString()
      .notEmpty()
      .isLength({ max: 2048 })
      .withMessage("refresh_token is required."),
    body("remember").optional().isBoolean().withMessage("remember must be a boolean."),
  ],
  validateRequest,
  refreshSession,
);

router.post(
  "/google",
  body("id_token")
    .isString()
    .notEmpty()
    .isLength({ max: 8192 })
    .withMessage("id_token is required."),
  validateRequest,
  loginWithGoogle,
);

router.post(
  "/apple",
  [
    body("id_token")
      .isString()
      .notEmpty()
      .isLength({ max: 8192 })
      .withMessage("id_token is required."),
    personNameBody("first_name", { optional: true }),
    personNameBody("last_name", { optional: true }),
  ],
  validateRequest,
  loginWithApple,
);

router.post(
  "/forgot-password",
  emailBody("email"),
  validateRequest,
  forgotPassword,
);

router.post(
  "/verify-otp",
  [emailBody("email"), otpBody("otp")],
  validateRequest,
  verifyOtp,
);

router.post(
  "/reset-password",
  [
    body("user_id").isInt({ min: 1 }).withMessage("user_id must be a valid integer."),
    passwordBody("new_password"),
    body("confirm_password")
      .isString()
      .custom((value, { req }) => value === req.body.new_password)
      .withMessage("confirm_password must match new_password."),
  ],
  validateRequest,
  resetPassword,
);

router.post(
  "/change-password",
  authenticateUser,
  [
    passwordBody("current_password"),
    passwordBody("new_password"),
    body("confirm_password")
      .isString()
      .withMessage("confirm_password must be a string.")
      .custom((value, { req }) => value === req.body.new_password)
      .withMessage("confirm_password must match new_password."),
  ],
  validateRequest,
  changePassword,
);

router.post(
  "/verify-email",
  body("token")
    .optional()
    .isString()
    .isLength({ max: 512 })
    .withMessage("token must be a valid string."),
  validateRequest,
  verifyEmail,
);

router.get("/verify-email", verifyEmail);

export default router;
