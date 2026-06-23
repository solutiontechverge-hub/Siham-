import express from "express";
import { body } from "express-validator";
import {
  createBooking,
  createCalendarEntry,
  deleteCalendarEntry,
  updateCalendarEntryStatus,
  updateBookingStatus,
  getCalendarOverview,
  upsertCalendarSettings,
  createCategory,
  createSubcategory,
  getBusinessSetup,
  updateBusinessSetupActive,
  uploadBusinessMedia,
  listBookings,
  listCalendarEntries,
  listCategories,
  upsertBusinessSetup,
} from "../controllers/business.controller.js";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();
const locationModes = ["fixed", "desired", "both"];
const locationTypes = ["fixed", "desired"];
const calendarStatuses = ["requested", "cancelled", "completed", "confirmed", "blocked", "no_show"];
const bookingStatuses = ["requested", "cancelled", "completed", "confirmed", "no_show"];
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

router.delete(
  "/calendar/:id",
  requireProfessional,
  deleteCalendarEntry,
);

router.get("/bookings", listBookings);

router.post(
  "/bookings",
  [
    body("booking_date").isISO8601().withMessage("booking_date must be a valid date."),
    body("business_setup_id")
      .isInt({ min: 1 })
      .withMessage("business_setup_id must be a valid integer."),
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
      .withMessage("status must be requested, cancelled, completed, confirmed, or no_show."),
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
      .withMessage("status must be requested, cancelled, completed, confirmed, or no_show."),
  ],
  validateRequest,
  updateBookingStatus,
);

export default router;
