import { Server } from "socket.io";
import {
  appendThreadMessageLegacy,
  deleteMessage,
  getThreadMessagesLegacy,
  purgeExpiredMessages,
} from "./messaging.repository.js";

export function attachMessagingSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("messaging:join", ({ threadIds } = {}) => {
      const ids = Array.isArray(threadIds) ? threadIds : [];
      ids.forEach((threadId) => {
        if (threadId) socket.join(`thread:${threadId}`);
      });
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
        io.to(`thread:${threadId}`).emit("messaging:message", { threadId, message });
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
        io.to(`thread:${result.threadId}`).emit("messaging:message-deleted", result);
        if (typeof callback === "function") callback({ ok: true, data: result });
      } catch (error) {
        if (typeof callback === "function") callback({ ok: false, message: error.message });
      }
    });
  });

  return io;
}
