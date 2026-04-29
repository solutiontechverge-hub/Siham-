import express from "express";
import { body } from "express-validator";
import {
  createBooking,
  createBusinessServiceDetail,
  createCalendarEntry,
  createCategory,
  createSubcategory,
  getBusinessSetup,
  listBookings,
  listBusinessServiceDetails,
  listCalendarEntries,
  listCategories,
  upsertBusinessSetup,
} from "../controllers/business.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = express.Router();
const locationModes = ["fixed", "desired", "both"];
const locationTypes = ["fixed", "desired"];
const calendarStatuses = ["requested", "cancelled", "completed", "confirmed", "blocked"];

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

router.get("/categories", listCategories);

router.post(
  "/categories",
  body("title").trim().notEmpty().withMessage("title is required."),
  validateRequest,
  createCategory,
);

router.post(
  "/subcategories",
  [
    body("category_id").isInt({ min: 1 }).withMessage("category_id must be a valid integer."),
    body("title").trim().notEmpty().withMessage("title is required."),
  ],
  validateRequest,
  createSubcategory,
);

router.get("/setup", getBusinessSetup);

router.put(
  "/setup",
  [
    body("location_mode")
      .trim()
      .isIn(locationModes)
      .withMessage("location_mode must be fixed, desired, or both."),
    body("business_keywords")
      .custom((value) => {
        const parsed = parseArrayLike(value);
        return Array.isArray(parsed) && parsed.length >= 3;
      })
      .withMessage("business_keywords must contain at least 3 items."),
    body("business_media")
      .custom((value) => {
        const parsed = parseArrayLike(value);
        return Array.isArray(parsed) && parsed.length >= 4;
      })
      .withMessage("business_media must contain at least 4 items."),
  ],
  validateRequest,
  upsertBusinessSetup,
);

router.get("/service-details", listBusinessServiceDetails);

router.post(
  "/service-details",
  [
    body("service_id").isInt({ min: 1 }).withMessage("service_id must be a valid integer."),
    body("price").isFloat({ min: 0 }).withMessage("price must be a non-negative number."),
  ],
  validateRequest,
  createBusinessServiceDetail,
);

router.get("/calendar", listCalendarEntries);

router.post(
  "/calendar",
  [
    body("status")
      .trim()
      .isIn(calendarStatuses)
      .withMessage("status must be requested, cancelled, completed, confirmed, or blocked."),
    body("title").trim().notEmpty().withMessage("title is required."),
    body("unique_code").trim().notEmpty().withMessage("unique_code is required."),
    body("location_type")
      .optional({ values: "falsy" })
      .trim()
      .isIn(locationTypes)
      .withMessage("location_type must be fixed or desired."),
  ],
  validateRequest,
  createCalendarEntry,
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
  ],
  validateRequest,
  createBooking,
);

export default router;
