import express from "express";
import { body, param } from "express-validator";
import { getProfile, setProfessionalValidation, updateProfile } from "../controllers/user.controller.js";
import {
  listUserFavorites,
  putUserFavorites,
  toggleUserFavorite,
} from "../controllers/favorites.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validateImageUploadContent } from "../middleware/validateUploadContent.middleware.js";
import { optionalOtherLink, optionalWebsite } from "../validators/optionalWebUrl.js";
import {
  cocBody,
  emailBody,
  passwordBody,
  personNameBody,
  textBody,
  uuidArrayBody,
  uuidParam,
  vatBody,
  LIMITS,
} from "../validators/fields.js";

const router = express.Router();

router.get("/profile", authenticateUser, getProfile);

router.get("/favorites", authenticateUser, listUserFavorites);
router.put(
  "/favorites",
  authenticateUser,
  [uuidArrayBody("businessSetupIds", { max: 200 })],
  validateRequest,
  putUserFavorites,
);
router.post(
  "/favorites/:businessSetupId/toggle",
  authenticateUser,
  [uuidParam("businessSetupId")],
  validateRequest,
  toggleUserFavorite,
);

router.put(
  "/profile",
  authenticateUser,
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  validateImageUploadContent,
  [
    emailBody("email", { optional: true }),
    passwordBody("password", { optional: true }),
    body("confirm_password")
      .optional({ values: "falsy" })
      .custom((value, { req }) => !req.body.password || value === req.body.password)
      .withMessage("confirm_password must match password."),
    personNameBody("first_name", { optional: true }),
    personNameBody("last_name", { optional: true }),
    personNameBody("contact_first_name", { optional: true }),
    personNameBody("contact_last_name", { optional: true }),
    textBody("legal_name", { optional: true, max: LIMITS.personName }),
    textBody("display_name", { optional: true, max: LIMITS.personName }),
    textBody("phone", { optional: true, max: LIMITS.phone }),
    textBody("country_code", { optional: true, max: 8 }),
    textBody("gender", { optional: true, max: 32 }),
    textBody("street", { optional: true, max: LIMITS.textShort }),
    textBody("street_number", { optional: true, max: 20 }),
    textBody("postal_code", { optional: true, max: 12 }),
    textBody("province", { optional: true, max: LIMITS.textShort }),
    textBody("municipality", { optional: true, max: LIMITS.textShort }),
    cocBody("ccc_number", { optional: true }),
    vatBody("vat_number", { optional: true }),
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
  updateProfile,
);

router.patch(
  "/professionals/:userId/validation",
  [
    uuidParam("userId"),
    body("validation_status")
      .isIn(["validated", "not_validated", "pending"])
      .withMessage("validation_status must be validated, not_validated, or pending."),
  ],
  validateRequest,
  setProfessionalValidation,
);

export default router;
