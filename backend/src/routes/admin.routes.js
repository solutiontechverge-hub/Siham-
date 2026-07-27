import express from "express";
import { body } from "express-validator";
import {
  createAdminActivityLog,
  getAdminActivityLog,
  getAdminDashboard,
} from "../controllers/admin.controller.js";
import { adminLogin, adminMe } from "../controllers/adminAuth.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = express.Router();

router.post(
  "/auth/login",
  [
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
  ],
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
