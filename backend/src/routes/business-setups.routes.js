import express from "express";
import { query } from "express-validator";
import {
  getPublicBusinessHoursForSetup,
  getSetupAvailabilityForDate,
  listAllBusinessSetups,
} from "../controllers/business-setups.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { uuidParam } from "../validators/fields.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/all", listAllBusinessSetups);
router.get(
  "/:setupId/public-hours",
  [uuidParam("setupId")],
  validateRequest,
  getPublicBusinessHoursForSetup,
);
router.get(
  "/:setupId/availability",
  [
    uuidParam("setupId"),
    query("date")
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date must be YYYY-MM-DD."),
    query("location")
      .optional({ values: "falsy" })
      .trim()
      .isIn(["FL", "DL", "fl", "dl"])
      .withMessage("location must be FL or DL."),
    query("excludeBookingId")
      .optional({ values: "falsy" })
      .trim()
      .isUUID()
      .withMessage("excludeBookingId must be a UUID."),
  ],
  validateRequest,
  getSetupAvailabilityForDate,
);

export default router;
