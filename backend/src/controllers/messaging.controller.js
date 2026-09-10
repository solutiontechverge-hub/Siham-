import {
  appendThreadMessage,
  clearThreadMessages,
  deleteMessage,
  getInboxForUser,
  getPeerUserIdForThread,
  getThreadMessages,
  linkThreadToBooking,
  listLinkableBookingsForThread,
  listProfessionalsForClient,
  markThreadRead,
  openThreadForBooking,
} from "../messaging/messaging.repository.js";
import { emitMessagingMessage, emitMessagingMessageDeleted, emitMessagingThreadRead } from "../messaging/messagingSocket.js";
import { saveMessagingAttachments } from "../services/messaging-upload.service.js";
import { buildPaginationMeta, parseListPagination } from "../utils/pagination.js";

export const uploadMessagingAttachments = async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files provided.",
        data: null,
      });
    }

    const attachments = await saveMessagingAttachments(req.user.id, files);
    return res.status(201).json({
      success: true,
      message: "Attachments uploaded successfully.",
      data: { attachments },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to upload attachments.",
      data: null,
    });
  }
};

export const getMessagingInbox = async (req, res) => {
  try {
    const data = await getInboxForUser(req.user.id, req.user.user_type);
    return res.status(200).json({
      success: true,
      message: "Messaging inbox fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch messaging inbox.",
      data: null,
    });
  }
};

export const openMessagingForBooking = async (req, res) => {
  try {
    const bookingRef = String(
      req.query.bookingRef ?? req.query.booking ?? req.body?.bookingRef ?? "",
    ).trim();
    const customerId = String(
      req.query.customerId ?? req.body?.customerId ?? "",
    ).trim();
    const data = await openThreadForBooking(req.user.id, bookingRef, {
      customerId,
    });
    return res.status(200).json({
      success: true,
      message: "Conversation opened for booking.",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to open conversation for booking.",
      data: null,
    });
  }
};

export const getMessagingProfessionals = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query, {
      defaultLimit: 5,
      maxLimit: 50,
      force: true,
    });
    const search = String(req.query.q ?? "");
    const data = await listProfessionalsForClient({
      offset: pagination.offset,
      limit: pagination.limit,
      search,
    });
    return res.status(200).json({
      success: true,
      message: "Professionals fetched successfully.",
      data,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: data.total ?? 0,
        paginate: true,
      }),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch professionals.",
      data: null,
    });
  }
};

export const getMessagingThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const messages = await getThreadMessages(threadId, req.user.id);
    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: { threadId, messages },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch messages.",
      data: null,
    });
  }
};

export const postMessagingMessage = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await appendThreadMessage(threadId, req.user.id, {
      body: req.body?.body,
      attachments: req.body?.attachments,
      clientMessageId: req.body?.clientMessageId,
    });

    emitMessagingMessage(result.threadId, result.message, result.peerUserId);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send message.",
      data: null,
    });
  }
};

export const removeMessagingMessage = async (req, res) => {
  try {
    const { threadId, messageId } = req.params;
    const scope = req.body?.scope === "everyone" ? "everyone" : "me";
    const result = await deleteMessage(threadId, messageId, req.user.id, scope);

    if (result.deletedForEveryone) {
      const peerUserId = await getPeerUserIdForThread(result.threadId, req.user.id);
      emitMessagingMessageDeleted(result.threadId, result, peerUserId);
    }

    return res.status(200).json({
      success: true,
      message: scope === "everyone" ? "Message deleted for everyone." : "Message deleted for you.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete message.",
      data: null,
    });
  }
};

export const markMessagingThreadRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await markThreadRead(threadId, req.user.id, req.body?.messageId);
    emitMessagingThreadRead(result.threadId, result);
    return res.status(200).json({
      success: true,
      message: "Thread marked as read.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to mark thread as read.",
      data: null,
    });
  }
};

export const clearMessagingThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const scope = req.body?.scope === "everyone" ? "everyone" : "me";
    const result = await clearThreadMessages(threadId, req.user.id, scope);
    return res.status(200).json({
      success: true,
      message: scope === "everyone" ? "Chat cleared for everyone." : "Chat cleared for you.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to clear chat.",
      data: null,
    });
  }
};

export const getMessagingLinkableBookings = async (req, res) => {
  try {
    const { threadId } = req.params;
    const data = await listLinkableBookingsForThread(threadId, req.user.id);
    return res.status(200).json({
      success: true,
      message: "Linkable bookings fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch linkable bookings.",
      data: null,
    });
  }
};

export const postMessagingLinkBooking = async (req, res) => {
  try {
    const { threadId } = req.params;
    const bookingRef = req.body?.bookingId || req.body?.bookingRef || req.body?.id;
    const data = await linkThreadToBooking(threadId, req.user.id, bookingRef);
    return res.status(200).json({
      success: true,
      message: "Conversation linked to booking.",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to link conversation to booking.",
      data: null,
    });
  }
};
