import express from "express";
import { body } from "express-validator";
import {
  createAdminActivityLog,
  getAdminActivityLog,
  getAdminDashboard,
} from "../controllers/admin.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get("/dashboard", getAdminDashboard);
router.get("/activity", getAdminActivityLog);
router.post(
  "/activity",
  [
    body("action").trim().notEmpty().withMessage("action is required."),
    body("detail").optional({ values: "falsy" }).trim(),
    body("color").optional().isIn(["teal", "navy", "warning", "mint"]),
    body("module").optional({ values: "falsy" }).trim(),
    body("action_type").optional({ values: "falsy" }).trim(),
  ],
  validateRequest,
  createAdminActivityLog,
);

export default router;
