import { Router } from "express";
import {
  clearMessagingThread,
  getMessagingInbox,
  getMessagingLinkableBookings,
  getMessagingProfessionals,
  getMessagingThreadMessages,
  markMessagingThreadRead,
  openMessagingForBooking,
  postMessagingLinkBooking,
  postMessagingMessage,
  removeMessagingMessage,
  uploadMessagingAttachments,
} from "../controllers/messaging.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { messagingUpload } from "../middleware/messagingUpload.middleware.js";

const router = Router();

router.use(authenticateUser);

router.post(
  "/attachments",
  (req, res, next) => {
    messagingUpload.array("files", 8)(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Failed to upload attachments.",
          data: null,
        });
      }
      return next();
    });
  },
  uploadMessagingAttachments,
);

router.get("/inbox", getMessagingInbox);
router.get("/open-for-booking", openMessagingForBooking);
router.get("/professionals", getMessagingProfessionals);
router.get("/threads/:threadId/messages", getMessagingThreadMessages);
router.get("/threads/:threadId/linkable-bookings", getMessagingLinkableBookings);
router.post("/threads/:threadId/link-booking", postMessagingLinkBooking);
router.post("/threads/:threadId/read", markMessagingThreadRead);
router.post("/threads/:threadId/messages", postMessagingMessage);
router.post("/threads/:threadId/clear", clearMessagingThread);
router.delete("/threads/:threadId/messages/:messageId", removeMessagingMessage);

export default router;

