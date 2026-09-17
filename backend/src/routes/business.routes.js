import express from "express";
import { body, param } from "express-validator";
import {
  createBooking,
  createBookingNotification,
  createCalendarEntry,
  deleteCalendarEntry,
  updateCalendarEntry,
  updateCalendarEntryStatus,
  updateBookingStatus,
  updateMyBooking,
  manageBookingEditRequest,
  getBookingActivity,
  getCalendarOverview,
  upsertCalendarSettings,
  createCategory,
  createSubcategory,
  getBusinessSetup,
  updateBusinessSetupActive,
  uploadBusinessMedia,
  uploadBookingAttachments,
  listBookings,
  listCalendarEntries,
  listCategories,
  upsertBusinessSetup,
  updateTeamMember,
} from "../controllers/business.controller.js";
import {
  createProfessionalClient,
  deleteProfessionalClient,
  listMollureClientDirectory,
  listProfessionalClients,
  lookupMollureClientByEmail,
  setProfessionalClientBlocked,
  updateProfessionalClient,
  updateProfessionalClientTechnicalNote,
} from "../controllers/professional-clients.controller.js";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { messagingUpload } from "../middleware/messagingUpload.middleware.js";
import {
  validateImageUploadContent,
  validateMessagingUploadContent,
} from "../middleware/validateUploadContent.middleware.js";
import { sendCaughtError } from "../utils/httpError.js";
import {
  cocBody,
  emailBody,
  personNameBody,
  textBody,
  uuidParam,
  vatBody,
  LIMITS,
} from "../validators/fields.js";

const router = express.Router();
const locationModes = ["fixed", "desired", "both"];
const locationTypes = ["fixed", "desired"];
const calendarStatuses = [
  "requested",
  "br_accepted",
  "cancelled",
  "completed",
  "confirmed",
  "blocked",
  "in_progress",
  "no_show",
  "invalid",
];
const bookingStatuses = [
  "requested",
  "br_accepted",
  "cancelled",
  "completed",
  "confirmed",
  "in_progress",
  "no_show",
  "invalid",
];
const percentageFields = [
  "prepayment_percentage",
  "late_reschedule_fee_percentage",
  "late_cancellation_fee_percentage",
  "no_show_fee_percentage",
];
const nonNegativeNumberFields = ["kilometer_allowance"];
const nonNegativeIntegerFields = [
  "response_time_hours",
  "appointment_before_hours",
  "cancellation_before_hours",
];
const minuteFields = [
  "response_time_minutes",
  "appointment_before_minutes",
  "cancellation_before_minutes",
];

const parseArrayLike = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

router.use(authenticateUser);
const requireProfessional = authorizeRoles("professional");

router.get("/categories", listCategories);

router.post(
  "/categories",
  requireProfessional,
  body("title").trim().notEmpty().withMessage("title is required."),
  validateRequest,
  createCategory,
);

router.post(
  "/subcategories",
  requireProfessional,
  [
    body("category_id").trim().notEmpty().withMessage("category_id is required."),
    body("title").trim().notEmpty().withMessage("title is required."),
  ],
  validateRequest,
  createSubcategory,
);

router.get("/setup", requireProfessional, getBusinessSetup);

router.patch(
  "/setup/active",
  requireProfessional,
  body("is_active").isBoolean().withMessage("is_active must be a boolean."),
  validateRequest,
  updateBusinessSetupActive,
);

router.post(
  "/setup/media",
  requireProfessional,
  upload.array("business_media", 10),
  validateImageUploadContent,
  uploadBusinessMedia,
);

router.patch(
  "/team-members/:id",
  requireProfessional,
  messagingUpload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "personal_document", maxCount: 5 },
  ]),
  validateMessagingUploadContent,
  (req, res, next) => {
    if (typeof req.body?.assigned_services === "string" && req.body.assigned_services.trim()) {
      try {
        req.body.assigned_services = JSON.parse(req.body.assigned_services);
      } catch {
        return res.status(400).json({
          success: false,
          message: "assigned_services must be valid JSON.",
          data: null,
        });
      }
    }
    if (typeof req.body?.personal_documents === "string" && req.body.personal_documents.trim()) {
      try {
        req.body.personal_documents = JSON.parse(req.body.personal_documents);
      } catch {
        return res.status(400).json({
          success: false,
          message: "personal_documents must be valid JSON.",
          data: null,
        });
      }
    }
    return next();
  },
  [
    uuidParam("id"),
    textBody("full_name", { optional: true, max: LIMITS.personName }),
    personNameBody("first_name", { optional: true }),
    personNameBody("last_name", { optional: true }),
    emailBody("email", { optional: true }),
    textBody("contact_number", { optional: true, max: LIMITS.phone }),
    textBody("emergency_contact_name", { optional: true, max: LIMITS.personName }),
    textBody("emergency_contact_number", { optional: true, max: LIMITS.phone }),
    textBody("personal_note", { optional: true, min: LIMITS.notesMin, max: null }),
    body("assigned_services")
      .optional({ values: "falsy" })
      .isArray()
      .withMessage("assigned_services must be an array."),
  ],
  validateRequest,
  updateTeamMember,
);

const parseBusinessSetupBody = (req, res, next) => {
  if (typeof req.body?.setup === "string" && req.body.setup.trim()) {
    try {
      const parsed = JSON.parse(req.body.setup);
      req.body = { ...parsed, ...req.body };
      delete req.body.setup;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid setup payload.",
        data: null,
      });
    }
  }

  if (req.body?.publish === "true") req.body.publish = true;
  if (req.body?.publish === "false") req.body.publish = false;

  return next();
};

const businessSetupValidators = [
    body("location_mode")
      .custom((value) => {
        const mode = String(value ?? "").trim();
        return locationModes.includes(mode);
      })
      .withMessage("location_mode must be fixed, desired, or both."),
    body("business_keywords")
      .optional({ values: "falsy" })
      .custom((value) => {
        const parsed = parseArrayLike(value);
        return Array.isArray(parsed) && parsed.length <= 5;
      })
      .withMessage("business_keywords can contain up to 5 items."),
    body("business_media")
      .optional({ values: "falsy" })
      .custom((value) => {
        const parsed = parseArrayLike(value);
        return Array.isArray(parsed) && parsed.length <= 10;
      })
      .withMessage("business_media can contain up to 10 items."),
    body("service_categories")
      .optional({ values: "falsy" })
      .custom((value) => Array.isArray(parseArrayLike(value)))
      .withMessage("service_categories must be an array."),
    body("book_service_combinations")
      .optional({ values: "falsy" })
      .custom((value) => Array.isArray(parseArrayLike(value)))
      .withMessage("book_service_combinations must be an array."),
    ...percentageFields.map((field) =>
      body(field)
        .optional({ values: "falsy" })
        .isFloat({ min: 0, max: 100 })
        .withMessage(`${field} must be a number between 0 and 100.`),
    ),
    ...nonNegativeNumberFields.map((field) =>
      body(field)
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage(`${field} must be a non-negative number.`),
    ),
    ...nonNegativeIntegerFields.map((field) =>
      body(field)
        .optional({ values: "falsy" })
        .isInt({ min: 0 })
        .withMessage(`${field} must be a non-negative integer.`),
    ),
    ...minuteFields.map((field) =>
      body(field)
        .optional({ values: "falsy" })
        .isInt({ min: 0, max: 59 })
        .withMessage(`${field} must be an integer between 0 and 59.`),
    ),
    body("team_members")
      .optional({ values: "falsy" })
      .custom((value) => Array.isArray(parseArrayLike(value)))
      .withMessage("team_members must be an array."),
    body("section_sync_settings")
      .optional({ values: "falsy" })
      .custom((value) => {
        if (value == null || value === "") return true;
        if (typeof value === "object" && !Array.isArray(value)) return true;
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed);
          } catch {
            return false;
          }
        }
        return false;
      })
      .withMessage("section_sync_settings must be an object."),
];

const saveBusinessSetupHandlers = [
  requireProfessional,
  upload.any(),
  validateImageUploadContent,
  parseBusinessSetupBody,
  ...businessSetupValidators,
  validateRequest,
  upsertBusinessSetup,
];

router.put("/setup", ...saveBusinessSetupHandlers);
router.post("/setup", ...saveBusinessSetupHandlers);

router.get("/calendar", requireProfessional, listCalendarEntries);
router.get("/calendar/overview", requireProfessional, getCalendarOverview);
router.put(
  "/calendar/settings",
  requireProfessional,
  [
    body("availability")
      .optional({ values: "falsy" })
      .custom((value) => typeof value === "object" || typeof value === "string")
      .withMessage("availability must be an object."),
    body("design")
      .optional({ values: "falsy" })
      .custom((value) => typeof value === "object" || typeof value === "string")
      .withMessage("design must be an object."),
  ],
  validateRequest,
  upsertCalendarSettings,
);

router.post(
  "/calendar",
  requireProfessional,
  [
    body("status")
      .trim()
      .isIn(calendarStatuses)
      .withMessage("status must be requested, cancelled, completed, confirmed, or blocked."),
    textBody("title", { min: 1, max: LIMITS.textShort, label: "title" }),
    textBody("unique_code", { optional: true, max: 64, label: "unique_code" }),
    textBody("notes", { optional: true, min: 0, max: null, label: "notes" }),
    body("team_member_id")
      .optional({ values: "falsy" })
      .isUUID()
      .withMessage("team_member_id must be a valid UUID."),
    body("booking_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["online", "offline", "project", "request"])
      .withMessage("booking_type must be online, offline, project, or request."),
    body("location_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(locationTypes)
      .withMessage("location_type must be fixed or desired."),
  ],
  validateRequest,
  createCalendarEntry,
);
router.patch(
  "/calendar/:id/status",
  requireProfessional,
  [
    uuidParam("id"),
    body("status")
      .trim()
      .isIn(calendarStatuses)
      .withMessage("status must be requested, cancelled, completed, confirmed, blocked, or no_show."),
  ],
  validateRequest,
  updateCalendarEntryStatus,
);

router.put(
  "/calendar/:id",
  requireProfessional,
  [
    uuidParam("id"),
    body("status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(calendarStatuses)
      .withMessage("status must be requested, cancelled, completed, confirmed, or blocked."),
    textBody("title", { optional: true, max: LIMITS.textShort, label: "title" }),
    textBody("notes", { optional: true, min: 0, max: null, label: "notes" }),
    body("team_member_id")
      .optional({ values: "falsy" })
      .isUUID()
      .withMessage("team_member_id must be a valid UUID."),
    body("booking_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["online", "offline", "project", "request"])
      .withMessage("booking_type must be online, offline, project, or request."),
    body("location_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(locationTypes)
      .withMessage("location_type must be fixed or desired."),
  ],
  validateRequest,
  updateCalendarEntry,
);

router.delete(
  "/calendar/:id",
  requireProfessional,
  [uuidParam("id")],
  validateRequest,
  deleteCalendarEntry,
);

router.get("/bookings", listBookings);

router.post(
  "/bookings/attachments",
  (req, res, next) => {
    messagingUpload.array("files", 8)(req, res, (error) => {
      if (error) {
        return sendCaughtError(res, error, { fallbackMessage: "Failed to upload booking attachments." });
      }
      return next();
    });
  },
  validateMessagingUploadContent,
  uploadBookingAttachments,
);

router.post(
  "/bookings",
  [
    body("booking_date").isISO8601().withMessage("booking_date must be a valid date."),
    body("business_setup_id")
      .isUUID()
      .withMessage("business_setup_id must be a valid UUID."),
    body("location_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(locationTypes)
      .withMessage("location_type must be fixed or desired."),
    body("booking_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["online", "offline", "project", "request"])
      .withMessage("booking_type must be online, offline, project, or request."),
    body("status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(bookingStatuses)
      .withMessage("status must be requested, br_accepted, cancelled, completed, confirmed, in_progress, no_show, or invalid."),
  ],
  validateRequest,
  createBooking,
);
router.patch(
  "/bookings/:id/status",
  requireProfessional,
  [
    body("status")
      .trim()
      .isIn(bookingStatuses)
      .withMessage("status must be requested, br_accepted, cancelled, completed, confirmed, in_progress, no_show, or invalid."),
    textBody("notes", { optional: true, min: 0, max: null, label: "notes" }),
    body("total_price")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("total_price must be a non-negative number."),
    body("booking_date")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("booking_date must be YYYY-MM-DD."),
    body("start_time")
      .optional({ values: "falsy" })
      .trim()
      .isISO8601()
      .withMessage("start_time must be a valid datetime."),
    body("end_time")
      .optional({ values: "falsy" })
      .trim()
      .isISO8601()
      .withMessage("end_time must be a valid datetime."),
  ],
  validateRequest,
  updateBookingStatus,
);

router.get(
  "/bookings/:id/activity",
  [uuidParam("id")],
  validateRequest,
  getBookingActivity,
);

router.post(
  "/bookings/:id/notifications",
  [
    uuidParam("id"),
    textBody("event", { optional: true, max: 64, label: "event" }),
    textBody("message", { optional: true, max: LIMITS.textLong, label: "message" }),
  ],
  validateRequest,
  createBookingNotification,
);

router.post(
  "/bookings/:id/edit-request",
  [
    uuidParam("id"),
    body("action")
      .trim()
      .isIn(["send", "accept", "reject"])
      .withMessage("action must be send, accept, or reject."),
    textBody("note", { optional: true, min: LIMITS.notesMin, max: null, label: "note" }),
  ],
  validateRequest,
  manageBookingEditRequest,
);

router.patch(
  "/bookings/:id",
  [
    uuidParam("id"),
    body("status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["cancelled", "confirmed", "requested", "br_accepted", "invalid"])
      .withMessage("status must be cancelled, confirmed, requested, br_accepted, or invalid."),
    body("prepayment_status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["paid", "pending", "failed", "required"])
      .withMessage("prepayment_status must be paid, pending, failed, or required."),
    textBody("notes", { optional: true, min: 0, max: null, label: "notes" }),
    body("total_price")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("total_price must be a non-negative number."),
    body("booking_date")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("booking_date must be YYYY-MM-DD."),
    body("start_time")
      .optional({ values: "falsy" })
      .trim()
      .isISO8601()
      .withMessage("start_time must be a valid datetime."),
    body("end_time")
      .optional({ values: "falsy" })
      .trim()
      .isISO8601()
      .withMessage("end_time must be a valid datetime."),
  ],
  validateRequest,
  updateMyBooking,
);

router.get("/clients", requireProfessional, listProfessionalClients);
router.get("/clients/mollure-lookup", requireProfessional, lookupMollureClientByEmail);
router.get("/clients/mollure-directory", requireProfessional, listMollureClientDirectory);
router.post(
  "/clients",
  requireProfessional,
  [
    body("client_kind")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["individual", "company"])
      .withMessage("client_kind must be individual or company."),
    body("email")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 254 })
      .isEmail()
      .withMessage("email must be valid."),
    body("mollure_user_id")
      .optional({ values: "falsy" })
      .isUUID()
      .withMessage("mollure_user_id must be a UUID."),
    body("first_name")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 80 })
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/)
      .withMessage("first_name format is invalid."),
    body("last_name")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 80 })
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/)
      .withMessage("last_name format is invalid."),
    body("legal_name")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 120 })
      .withMessage("legal_name is too long."),
    body("coc")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^\d{8}$/)
      .withMessage("coc must be exactly 8 digits."),
    body("vat")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^NL\d{9}B\d{2}$/i)
      .withMessage("vat must match NL#########B##."),
    body("phone")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 32 })
      .withMessage("phone is too long."),
    body("country_code")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 8 })
      .withMessage("country_code is too long."),
    textBody("technical_note", {
      optional: true,
      min: LIMITS.notesMin,
      max: null,
    }),
  ],
  validateRequest,
  createProfessionalClient,
);
router.patch(
  "/clients/:id",
  requireProfessional,
  [
    uuidParam("id"),
    emailBody("email", { optional: true }),
    personNameBody("first_name", { optional: true }),
    personNameBody("last_name", { optional: true }),
    textBody("legal_name", { optional: true, max: LIMITS.personName }),
    cocBody("coc", { optional: true }),
    vatBody("vat", { optional: true }),
    textBody("contact_person_name", { optional: true, max: LIMITS.personName }),
    textBody("phone", { optional: true, max: LIMITS.phone }),
    textBody("country_code", { optional: true, max: 8 }),
    textBody("gender", { optional: true, max: 32 }),
    body("date_of_birth")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date_of_birth must be YYYY-MM-DD."),
    emailBody("detail_email", { optional: true }),
    textBody("business_address", { optional: true, max: LIMITS.textMedium }),
    textBody("residential_address", { optional: true, max: LIMITS.textMedium }),
    textBody("street", { optional: true, max: LIMITS.textShort }),
    textBody("street_number", { optional: true, max: 20 }),
    textBody("postal_code", { optional: true, max: 12 }),
    textBody("province", { optional: true, max: LIMITS.textShort }),
    textBody("municipality", { optional: true, max: LIMITS.textShort }),
    textBody("technical_note", {
      optional: true,
      min: LIMITS.notesMin,
      max: null,
    }),
  ],
  validateRequest,
  updateProfessionalClient,
);
router.patch(
  "/clients/:id/technical-note",
  requireProfessional,
  [
    param("id").isUUID().withMessage("id must be a valid UUID."),
    textBody("technical_note", {
      optional: true,
      min: LIMITS.notesMin,
      max: null,
    }),
  ],
  validateRequest,
  updateProfessionalClientTechnicalNote,
);
router.patch(
  "/clients/:id/block",
  requireProfessional,
  [
    param("id").isUUID().withMessage("id must be a valid UUID."),
    body("is_blocked").isBoolean().withMessage("is_blocked must be a boolean."),
  ],
  validateRequest,
  setProfessionalClientBlocked,
);
router.delete(
  "/clients/:id",
  requireProfessional,
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  deleteProfessionalClient,
);

export default router;
