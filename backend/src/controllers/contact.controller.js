import { submitContactMessage, replyToContactMessage } from "../services/contact.service.js";
import { logAdminActivityFromRequest } from "../services/adminActivity.service.js";
import { sendCaughtError } from "../utils/httpError.js";

export const createContactMessage = async (req, res) => {
  try {
    const { persona, name, email, subject, message } = req.body;

    const row = await submitContactMessage(req.user.id, {
      persona,
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been sent. We will get back to you shortly.",
      data: {
        id: row.id,
        created_at: row.created_at,
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to send your message." });
  }
};

export const adminReplyContactMessage = async (req, res) => {
  try {
    const { reply_message: replyMessage } = req.body;
    const result = await replyToContactMessage(req.params.id, replyMessage);

    if (!result.replied) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
        data: null,
      });
    }

    void logAdminActivityFromRequest(req, {
      action: "Replied to contact message",
      detail: `Contact message #${req.params.id}`,
      color: "navy",
      module: "email",
      actionType: "updated",
    });

    return res.status(200).json({
      success: true,
      message: "Reply sent to client.",
      data: result.message,
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to send reply." });
  }
};
