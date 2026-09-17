import express from "express";
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllMyNotificationsRead,
  markNotificationAsRead,
} from "../controllers/notifications.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { uuidParam } from "../validators/fields.js";

const router = express.Router();

router.get("/", authenticateUser, listMyNotifications);
router.get("/unread-count", authenticateUser, getUnreadNotificationCount);
router.patch("/read-all", authenticateUser, markAllMyNotificationsRead);
router.patch(
  "/:id/read",
  authenticateUser,
  [uuidParam("id")],
  validateRequest,
  markNotificationAsRead,
);

export default router;
