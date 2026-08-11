import express from "express";
import {
  getPublicBusinessHoursForSetup,
  getSetupAvailabilityForDate,
  listAllBusinessSetups,
} from "../controllers/business-setups.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/all", listAllBusinessSetups);
router.get("/:setupId/public-hours", getPublicBusinessHoursForSetup);
router.get("/:setupId/availability", getSetupAvailabilityForDate);

export default router;
