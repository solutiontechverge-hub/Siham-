import { Server } from "socket.io";
import { appendThreadMessage, getThreadMessages } from "./messagingStore.js";

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

    socket.on("messaging:history", ({ threadId }, callback) => {
      if (typeof callback !== "function") return;
      callback({ threadId, messages: getThreadMessages(threadId) });
    });

    socket.on("messaging:send", (payload = {}) => {
      const { threadId, message } = payload;
      if (!threadId || !message?.id) return;

      appendThreadMessage(threadId, message);
      io.to(`thread:${threadId}`).emit("messaging:message", { threadId, message });
    });
  });

  return io;
}
