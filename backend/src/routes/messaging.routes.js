import { Router } from "express";
import {
  clearMessagingThread,
  getMessagingInbox,
  getMessagingProfessionals,
  getMessagingThreadMessages,
  postMessagingMessage,
  removeMessagingMessage,
} from "../controllers/messaging.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

router.get("/inbox", getMessagingInbox);
router.get("/professionals", getMessagingProfessionals);
router.get("/threads/:threadId/messages", getMessagingThreadMessages);
router.post("/threads/:threadId/messages", postMessagingMessage);
router.post("/threads/:threadId/clear", clearMessagingThread);
router.delete("/threads/:threadId/messages/:messageId", removeMessagingMessage);

export default router;
