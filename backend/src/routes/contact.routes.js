import express from "express";
import { body } from "express-validator";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { adminReplyContactMessage, createContactMessage } from "../controllers/contact.controller.js";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  [
    body("persona").trim().notEmpty().withMessage("persona is required."),
    body("name").trim().notEmpty().withMessage("name is required."),
    body("email").trim().isEmail().withMessage("email must be valid."),
    body("subject").trim().notEmpty().withMessage("subject is required."),
    body("message").trim().isLength({ min: 10 }).withMessage("message must be at least 10 characters."),
  ],
  validateRequest,
  createContactMessage,
);

router.post(
  "/:id/reply",
  authenticateUser,
  [body("reply_message").trim().isLength({ min: 1 }).withMessage("reply_message is required.")],
  validateRequest,
  adminReplyContactMessage,
);

export default router;
