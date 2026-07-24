import { Server } from "socket.io";
import {
  appendThreadMessageLegacy,
  deleteMessage,
  getThreadMessagesLegacy,
  purgeExpiredMessages,
} from "./messaging.repository.js";

let messagingIo = null;

export function getMessagingIo() {
  return messagingIo;
}

function toBroadcastMessage(message) {
  if (!message) return message;
  const { senderSide, readByPeer, ...rest } = message;
  return rest;
}

export function emitMessagingMessage(threadId, message, peerUserId) {
  if (!messagingIo || !threadId || !message) return;
  const payload = { threadId, message: toBroadcastMessage(message) };
  messagingIo.to(`thread:${threadId}`).emit("messaging:message", payload);
  if (peerUserId) {
    messagingIo.to(`user:${peerUserId}`).emit("messaging:message", payload);
  }
}

export function emitMessagingMessageDeleted(threadId, payload, peerUserId) {
  if (!messagingIo || !threadId) return;
  messagingIo.to(`thread:${threadId}`).emit("messaging:message-deleted", payload);
  if (peerUserId) {
    messagingIo.to(`user:${peerUserId}`).emit("messaging:message-deleted", payload);
  }
}

export function emitMessagingThreadRead(threadId, payload) {
  if (!messagingIo || !threadId) return;
  messagingIo.to(`thread:${threadId}`).emit("messaging:read", payload);
}

export function emitBookingChanged(booking, action = "updated") {
  if (!messagingIo || !booking?.business_setup_id) return;
  const payload = {
    action,
    bookingId: booking.id,
    business_setup_id: booking.business_setup_id,
    customer_id: booking.customer_id,
  };
  messagingIo.to(`business:${booking.business_setup_id}`).emit("bookings:changed", payload);
  if (booking.customer_id) {
    messagingIo.to(`user:${booking.customer_id}`).emit("bookings:changed", payload);
  }
}

export function emitReviewChanged(payload = {}) {
  if (!messagingIo || !payload?.business_setup_id) return;
  messagingIo.to(`business:${payload.business_setup_id}`).emit("reviews:changed", payload);
  if (payload.client_user_id) {
    messagingIo.to(`user:${payload.client_user_id}`).emit("reviews:changed", payload);
  }
}

export function emitNotificationChanged(userId) {
  if (!messagingIo || !userId) return;
  messagingIo.to(`user:${userId}`).emit("notifications:changed", { userId });
}

export function attachMessagingSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    path: "/socket.io",
  });
  messagingIo = io;

  io.on("connection", (socket) => {
    socket.on("messaging:join-user", ({ userId } = {}) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("messaging:join", ({ threadIds } = {}) => {
      const ids = Array.isArray(threadIds) ? threadIds : [];
      ids.forEach((threadId) => {
        if (threadId) socket.join(`thread:${threadId}`);
      });
    });

    socket.on("bookings:join-business", ({ businessSetupId } = {}) => {
      if (businessSetupId) socket.join(`business:${businessSetupId}`);
    });

    socket.on("messaging:history", async ({ threadId }, callback) => {
      if (typeof callback !== "function") return;
      try {
        await purgeExpiredMessages();
        const messages = await getThreadMessagesLegacy(threadId);
        callback({ threadId, messages });
      } catch {
        callback({ threadId, messages: [] });
      }
    });

    socket.on("messaging:send", async (payload = {}) => {
      const { threadId, message } = payload;
      if (!threadId || !message?.id) return;

      try {
        await appendThreadMessageLegacy(threadId, message);
        const messages = await getThreadMessagesLegacy(threadId);
        const saved =
          messages.find((item) => item.id === message.id) ?? messages[messages.length - 1];
        if (saved) {
          emitMessagingMessage(threadId, saved);
        }
      } catch (error) {
        console.error("[messaging:socket] send failed:", error.message);
      }
    });

    socket.on("messaging:delete", async (payload = {}, callback) => {
      const { threadId, messageId, scope, userId } = payload;
      if (!threadId || !messageId || !userId) {
        if (typeof callback === "function") callback({ ok: false });
        return;
      }
      try {
        const result = await deleteMessage(threadId, messageId, userId, scope === "everyone" ? "everyone" : "me");
        emitMessagingMessageDeleted(result.threadId, result);
        if (typeof callback === "function") callback({ ok: true, data: result });
      } catch (error) {
        if (typeof callback === "function") callback({ ok: false, message: error.message });
      }
    });
  });

  return io;
}
