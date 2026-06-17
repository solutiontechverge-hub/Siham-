"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../../../lib/api";
import type { MessagingChatMessage } from "./messagingTypes";

let socket: Socket | null = null;

export function getMessagingSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(API_BASE_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinMessagingThreads(threadIds: string[]) {
  const client = getMessagingSocket();
  if (!client || !threadIds.length) return;
  client.emit("messaging:join", { threadIds });
}

export function emitMessagingSend(threadId: string, message: MessagingChatMessage) {
  const client = getMessagingSocket();
  if (!client) return;
  client.emit("messaging:send", { threadId, message });
}

export function fetchMessagingHistory(threadId: string): Promise<MessagingChatMessage[]> {
  return new Promise((resolve) => {
    const client = getMessagingSocket();
    if (!client) {
      resolve([]);
      return;
    }
    client.emit("messaging:history", { threadId }, (payload: { messages?: MessagingChatMessage[] }) => {
      resolve(payload?.messages ?? []);
    });
  });
}

export function onMessagingMessage(handler: (payload: { threadId: string; message: MessagingChatMessage }) => void) {
  const client = getMessagingSocket();
  if (!client) return () => {};
  client.on("messaging:message", handler);
  return () => {
    client.off("messaging:message", handler);
  };
}
