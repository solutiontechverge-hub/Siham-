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

router.get("/professionals", getAdminProfessionals);
router.patch(
  "/professionals/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  patchAdminProfessional,
);

router.get("/clients", getAdminClients);
router.patch(
  "/clients/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  patchAdminClient,
);

router.get("/reviews", getAdminReviewsModeration);
router.delete(
  "/reviews/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  deleteAdminReview,
);
router.post(
  "/reviews/keywords",
  [body("keyword").trim().notEmpty().withMessage("keyword is required.")],
  validateRequest,
  postAdminKeyword,
);
router.delete("/reviews/keywords/:keyword", deleteAdminKeyword);
router.put("/reviews/rating-ranges", putAdminRatingRanges);

router.get("/reports", getAdminReports);
router.patch(
  "/reports/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  patchAdminReport,
);

router.get("/messaging", getAdminMessaging);
router.post(
  "/messaging/:id/reply",
  [
    param("id").isUUID().withMessage("id must be a valid UUID."),
    body("reply").optional({ values: "falsy" }).trim(),
    body("replyMessage").optional({ values: "falsy" }).trim(),
  ],
  validateRequest,
  postAdminMessagingReply,
);
router.delete(
  "/messaging/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  deleteAdminMessaging,
);

router.get("/access/users", getAdminAccessUsers);
router.post("/access/users", postAdminAccessUser);
router.patch(
  "/access/users/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  patchAdminAccessUser,
);
router.delete(
  "/access/users/:id",
  [param("id").isUUID().withMessage("id must be a valid UUID.")],
  validateRequest,
  deleteAdminAccessUser,
);
router.get("/access/roles", getAdminAccessRoles);
router.put("/access/roles", putAdminAccessRole);
router.delete("/access/roles/:id", deleteAdminAccessRole);

router.get("/listing-ranking", getAdminListingRanking);

export default router;
