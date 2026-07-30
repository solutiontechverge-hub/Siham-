import express from "express";
import {
  getPublicBusinessHoursForSetup,
  listAllBusinessSetups,
} from "../controllers/business-setups.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/all", listAllBusinessSetups);
router.get("/:setupId/public-hours", getPublicBusinessHoursForSetup);

export default router;
