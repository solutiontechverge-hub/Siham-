import express from "express";
import { body } from "express-validator";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { adminReplyContactMessage, createContactMessage } from "../controllers/contact.controller.js";
import { emailBody, LIMITS, textBody, uuidParam } from "../validators/fields.js";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  [
    textBody("persona", { min: 1, max: 64, label: "persona" }),
    textBody("name", { min: 1, max: LIMITS.personName, label: "name" }),
    emailBody("email"),
    textBody("subject", { min: 1, max: LIMITS.subject, label: "subject" }),
    textBody("message", {
      min: LIMITS.messageMin,
      max: LIMITS.messageMax,
      label: "message",
    }),
  ],
  validateRequest,
  createContactMessage,
);

router.post(
  "/:id/reply",
  authenticateUser,
  [
    uuidParam("id"),
    textBody("reply_message", {
      min: 1,
      max: LIMITS.messageMax,
      label: "reply_message",
    }),
  ],
  validateRequest,
  adminReplyContactMessage,
);

export default router;
