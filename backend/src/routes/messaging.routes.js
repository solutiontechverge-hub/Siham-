import { Router } from "express";
import { body, param, query } from "express-validator";
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
import { validateMessagingUploadContent } from "../middleware/validateUploadContent.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  enumBody,
  messagingThreadIdParam,
  textBody,
  uuidBody,
  LIMITS,
} from "../validators/fields.js";
import { sendCaughtError } from "../utils/httpError.js";

const router = Router();

router.use(authenticateUser);

router.post(
  "/attachments",
  (req, res, next) => {
    messagingUpload.array("files", 8)(req, res, (error) => {
      if (error) {
        return sendCaughtError(res, error, { fallbackMessage: "Failed to upload attachments." });
      }
      return next();
    });
  },
  validateMessagingUploadContent,
  uploadMessagingAttachments,
);

router.get("/inbox", getMessagingInbox);

router.get(
  "/open-for-booking",
  [
    query("bookingRef")
      .optional({ values: "falsy" })
      .isString()
      .isLength({ max: 120 })
      .withMessage("bookingRef must be at most 120 characters."),
    query("booking")
      .optional({ values: "falsy" })
      .isString()
      .isLength({ max: 120 })
      .withMessage("booking must be at most 120 characters."),
    query("customerId")
      .optional({ values: "falsy" })
      .isUUID()
      .withMessage("customerId must be a valid UUID."),
  ],
  validateRequest,
  openMessagingForBooking,
);

router.get(
  "/professionals",
  [
    query("q")
      .optional({ values: "falsy" })
      .isString()
      .isLength({ max: LIMITS.textShort })
      .withMessage(`q must be at most ${LIMITS.textShort} characters.`),
  ],
  validateRequest,
  getMessagingProfessionals,
);

router.get(
  "/threads/:threadId/messages",
  [messagingThreadIdParam("threadId")],
  validateRequest,
  getMessagingThreadMessages,
);

router.get(
  "/threads/:threadId/linkable-bookings",
  [messagingThreadIdParam("threadId")],
  validateRequest,
  getMessagingLinkableBookings,
);

router.post(
  "/threads/:threadId/link-booking",
  [
    messagingThreadIdParam("threadId"),
    body().custom((_, { req }) => {
      const ref =
        req.body?.bookingId || req.body?.bookingRef || req.body?.id || "";
      if (!String(ref).trim()) {
        throw new Error("bookingId, bookingRef, or id is required.");
      }
      if (String(ref).length > 120) {
        throw new Error("booking reference must be at most 120 characters.");
      }
      return true;
    }),
  ],
  validateRequest,
  postMessagingLinkBooking,
);

router.post(
  "/threads/:threadId/read",
  [
    messagingThreadIdParam("threadId"),
    uuidBody("messageId", { optional: true }),
  ],
  validateRequest,
  markMessagingThreadRead,
);

router.post(
  "/threads/:threadId/messages",
  [
    messagingThreadIdParam("threadId"),
    body("body")
      .optional({ values: "null" })
      .isString()
      .withMessage("body must be a string.")
      .isLength({ max: LIMITS.textLong })
      .withMessage(`body must be at most ${LIMITS.textLong} characters.`),
    body("attachments")
      .optional()
      .isArray({ max: 8 })
      .withMessage("attachments must be an array of at most 8 items."),
    body("attachments.*.id")
      .optional()
      .isString()
      .isLength({ max: 120 })
      .withMessage("attachment id is invalid."),
    body("attachments.*.name")
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage("attachment name is invalid."),
    body("attachments.*.mimeType")
      .optional()
      .isString()
      .isLength({ max: 120 })
      .withMessage("attachment mimeType is invalid."),
    body("attachments.*.url")
      .optional()
      .isString()
      .isLength({ max: 2048 })
      .withMessage("attachment url is invalid."),
    textBody("clientMessageId", {
      optional: true,
      max: 120,
      label: "clientMessageId",
    }),
    body().custom((_, { req }) => {
      const text = String(req.body?.body ?? "").trim();
      const atts = Array.isArray(req.body?.attachments)
        ? req.body.attachments
        : [];
      if (!text && atts.length === 0) {
        throw new Error("Message body or attachment is required.");
      }
      return true;
    }),
  ],
  validateRequest,
  postMessagingMessage,
);

router.post(
  "/threads/:threadId/clear",
  [
    messagingThreadIdParam("threadId"),
    enumBody("scope", ["me", "everyone"], { optional: true }),
  ],
  validateRequest,
  clearMessagingThread,
);

router.delete(
  "/threads/:threadId/messages/:messageId",
  [
    messagingThreadIdParam("threadId"),
    param("messageId")
      .isString()
      .isLength({ min: 1, max: 120 })
      .withMessage("messageId is required."),
    enumBody("scope", ["me", "everyone"], { optional: true }),
  ],
  validateRequest,
  removeMessagingMessage,
);

export default router;
