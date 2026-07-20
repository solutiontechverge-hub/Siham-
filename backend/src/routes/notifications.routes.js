import express from "express";
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllMyNotificationsRead,
  markNotificationAsRead,
} from "../controllers/notifications.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateUser, listMyNotifications);
router.get("/unread-count", authenticateUser, getUnreadNotificationCount);
router.patch("/read-all", authenticateUser, markAllMyNotificationsRead);
router.patch("/:id/read", authenticateUser, markNotificationAsRead);

export default router;
