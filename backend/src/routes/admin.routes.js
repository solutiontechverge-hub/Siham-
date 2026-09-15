import express from "express";
import { body, param } from "express-validator";
import {
  createAdminActivityLog,
  getAdminActivityLog,
  getAdminDashboard,
} from "../controllers/admin.controller.js";
import { adminLogin, adminMe } from "../controllers/adminAuth.controller.js";
import {
  deleteAdminAccessRole,
  deleteAdminAccessUser,
  deleteAdminKeyword,
  deleteAdminMessaging,
  deleteAdminReview,
  getAdminAccessRoles,
  getAdminAccessUsers,
  getAdminClients,
  getAdminListingRanking,
  getAdminMessaging,
  getAdminProfessionals,
  getAdminReports,
  getAdminReviewsModeration,
  patchAdminAccessUser,
  patchAdminClient,
  patchAdminProfessional,
  patchAdminReport,
  postAdminAccessUser,
  postAdminKeyword,
  postAdminMessagingReply,
  putAdminAccessRole,
  putAdminRatingRanges,
} from "../controllers/adminManagement.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  emailBody,
  enumBody,
  passwordBody,
  textBody,
  uuidParam,
  LIMITS,
} from "../validators/fields.js";

const router = express.Router();

const PRO_ACCOUNT_STATUSES = [
  "active",
  "disabled",
  "awaiting_setup",
  "suspended",
];
const CLIENT_ACCOUNT_STATUSES = ["active", "disabled", "deleted"];
const VALIDATION_STATUSES = ["validated", "not_validated", "pending"];

router.post(
  "/auth/login",
  [emailBody("email"), passwordBody("password")],
  validateRequest,
  adminLogin,
);

router.use(authenticateAdmin);

router.get("/auth/me", adminMe);
router.get("/dashboard", getAdminDashboard);
router.get("/activity", getAdminActivityLog);
router.post(
  "/activity",
  [
    textBody("action", { min: 1, max: LIMITS.textShort, label: "action" }),
    textBody("detail", { optional: true, max: LIMITS.textMedium, label: "detail" }),
    body("color").optional().isIn(["teal", "navy", "warning", "mint"]),
    textBody("module", { optional: true, max: 64, label: "module" }),
    textBody("action_type", { optional: true, max: 64, label: "action_type" }),
  ],
  validateRequest,
  createAdminActivityLog,
);

router.get("/professionals", getAdminProfessionals);
router.patch(
  "/professionals/:id",
  [
    uuidParam("id"),
    enumBody("validationStatus", VALIDATION_STATUSES, { optional: true }),
    enumBody("accountStatus", PRO_ACCOUNT_STATUSES, { optional: true }),
  ],
  validateRequest,
  patchAdminProfessional,
);

router.get("/clients", getAdminClients);
router.patch(
  "/clients/:id",
  [
    uuidParam("id"),
    enumBody("accountStatus", CLIENT_ACCOUNT_STATUSES, { optional: true }),
    textBody("note", { optional: true, min: LIMITS.notesMin, max: null, label: "note" }),
    body("delete")
      .optional()
      .isBoolean()
      .withMessage("delete must be a boolean."),
  ],
  validateRequest,
  patchAdminClient,
);

router.get("/reviews", getAdminReviewsModeration);
router.delete(
  "/reviews/:id",
  [uuidParam("id")],
  validateRequest,
  deleteAdminReview,
);
router.post(
  "/reviews/keywords",
  [textBody("keyword", { min: 1, max: 64, label: "keyword" })],
  validateRequest,
  postAdminKeyword,
);
router.delete(
  "/reviews/keywords/:keyword",
  [
    param("keyword")
      .trim()
      .isLength({ min: 1, max: 64 })
      .withMessage("keyword must be 1–64 characters."),
  ],
  validateRequest,
  deleteAdminKeyword,
);
router.put(
  "/reviews/rating-ranges",
  [
    body().custom((value) => {
      const ranges =
        value?.ranges && typeof value.ranges === "object" ? value.ranges : value;
      if (!ranges || typeof ranges !== "object" || Array.isArray(ranges)) {
        throw new Error("rating ranges must be an object.");
      }
      for (const [id, entry] of Object.entries(ranges)) {
        if (!/^[0-9a-f-]{1,64}$/i.test(String(id))) {
          throw new Error("rating range id is invalid.");
        }
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          throw new Error("each rating range must be an object.");
        }
        if (
          entry.label != null &&
          (typeof entry.label !== "string" || entry.label.length > 120)
        ) {
          throw new Error("rating range label is invalid.");
        }
        if (
          entry.min != null &&
          (typeof entry.min !== "number" || entry.min < 0 || entry.min > 5)
        ) {
          throw new Error("rating range min must be 0–5.");
        }
        if (
          entry.max != null &&
          (typeof entry.max !== "number" || entry.max < 0 || entry.max > 5)
        ) {
          throw new Error("rating range max must be 0–5.");
        }
      }
      return true;
    }),
  ],
  validateRequest,
  putAdminRatingRanges,
);

router.get("/reports", getAdminReports);
router.patch(
  "/reports/:id",
  [
    uuidParam("id"),
    enumBody("status", ["new", "viewed"], { optional: true }),
    body("delete")
      .optional()
      .isBoolean()
      .withMessage("delete must be a boolean."),
  ],
  validateRequest,
  patchAdminReport,
);

router.get("/messaging", getAdminMessaging);
router.post(
  "/messaging/:id/reply",
  [
    uuidParam("id"),
    textBody("reply", { optional: true, max: LIMITS.messageMax, label: "reply" }),
    textBody("replyMessage", {
      optional: true,
      max: LIMITS.messageMax,
      label: "replyMessage",
    }),
  ],
  validateRequest,
  postAdminMessagingReply,
);
router.delete(
  "/messaging/:id",
  [uuidParam("id")],
  validateRequest,
  deleteAdminMessaging,
);

router.get("/access/users", getAdminAccessUsers);
router.post(
  "/access/users",
  [
    textBody("name", { min: 1, max: LIMITS.personName, label: "name" }),
    emailBody("email"),
    textBody("role", { optional: true, max: 64, label: "role" }),
    enumBody("status", ["active", "disabled"], { optional: true }),
    passwordBody("password", { optional: true }),
  ],
  validateRequest,
  postAdminAccessUser,
);
router.patch(
  "/access/users/:id",
  [
    uuidParam("id"),
    textBody("name", { optional: true, max: LIMITS.personName, label: "name" }),
    emailBody("email", { optional: true }),
    textBody("role", { optional: true, max: 64, label: "role" }),
    enumBody("status", ["active", "disabled"], { optional: true }),
  ],
  validateRequest,
  patchAdminAccessUser,
);
router.delete(
  "/access/users/:id",
  [uuidParam("id")],
  validateRequest,
  deleteAdminAccessUser,
);
router.get("/access/roles", getAdminAccessRoles);
router.put(
  "/access/roles",
  [
    textBody("id", { min: 1, max: 64, label: "id" }),
    textBody("name", { min: 1, max: LIMITS.personName, label: "name" }),
    textBody("description", {
      optional: true,
      max: LIMITS.textMedium,
      label: "description",
    }),
    enumBody("kind", ["system", "custom"], { optional: true }),
    textBody("icon", { optional: true, max: 64, label: "icon" }),
    body("permissions")
      .optional()
      .isObject()
      .withMessage("permissions must be an object."),
  ],
  validateRequest,
  putAdminAccessRole,
);
router.delete(
  "/access/roles/:id",
  [
    param("id")
      .trim()
      .isLength({ min: 1, max: 64 })
      .withMessage("id must be 1–64 characters."),
  ],
  validateRequest,
  deleteAdminAccessRole,
);

router.get("/listing-ranking", getAdminListingRanking);

export default router;
