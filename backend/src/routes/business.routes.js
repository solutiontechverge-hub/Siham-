import express from "express";
import { body } from "express-validator";
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

const router = express.Router();
const locationModes = ["fixed", "desired", "both"];
const locationTypes = ["fixed", "desired"];
const calendarStatuses = [
  "requested",
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
  upload.array("business_media", 4),
  uploadBusinessMedia,
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
        return Array.isArray(parsed) && parsed.length <= 4;
      })
      .withMessage("business_media can contain up to 4 items."),
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
    body("title").trim().notEmpty().withMessage("title is required."),
    body("unique_code").optional({ values: "falsy" }).trim(),
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
    body("status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(calendarStatuses)
      .withMessage("status must be requested, cancelled, completed, confirmed, or blocked."),
    body("title").optional({ values: "falsy" }).trim(),
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
  deleteCalendarEntry,
);

router.get("/bookings", listBookings);

router.post(
  "/bookings/attachments",
  (req, res, next) => {
    messagingUpload.array("files", 8)(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Failed to upload booking attachments.",
          data: null,
        });
      }
      return next();
    });
  },
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
      .withMessage("status must be requested, cancelled, completed, confirmed, in_progress, no_show, or invalid."),
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
      .withMessage("status must be requested, cancelled, completed, confirmed, in_progress, no_show, or invalid."),
    body("notes").optional({ values: "falsy" }).isString().withMessage("notes must be a string."),
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

router.post("/bookings/:id/notifications", createBookingNotification);

router.post(
  "/bookings/:id/edit-request",
  [
    body("action")
      .trim()
      .isIn(["send", "accept", "reject"])
      .withMessage("action must be send, accept, or reject."),
    body("note").optional({ values: "falsy" }).isString().withMessage("note must be a string."),
  ],
  validateRequest,
  manageBookingEditRequest,
);

router.patch(
  "/bookings/:id",
  [
    body("status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["cancelled", "confirmed", "requested"])
      .withMessage("status must be cancelled, confirmed, or requested."),
    body("prepayment_status")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["paid", "pending", "failed", "required"])
      .withMessage("prepayment_status must be paid, pending, failed, or required."),
    body("notes").optional({ values: "null" }).isString().withMessage("notes must be a string."),
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
    body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid."),
    body("mollure_user_id").optional({ values: "falsy" }).isUUID().withMessage("mollure_user_id must be a UUID."),
  ],
  validateRequest,
  createProfessionalClient,
);
router.patch(
  "/clients/:id",
  requireProfessional,
  validateRequest,
  updateProfessionalClient,
);
router.patch(
  "/clients/:id/technical-note",
  requireProfessional,
  [body("technical_note").optional().isString()],
  validateRequest,
  updateProfessionalClientTechnicalNote,
);
router.patch(
  "/clients/:id/block",
  requireProfessional,
  [body("is_blocked").isBoolean().withMessage("is_blocked must be a boolean.")],
  validateRequest,
  setProfessionalClientBlocked,
);
router.delete("/clients/:id", requireProfessional, deleteProfessionalClient);

export default router;
