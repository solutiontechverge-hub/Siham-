"use client";

import { io, type Socket } from "socket.io-client";
import { apiBaseUrl } from "../../../lib/api";
import type { MessagingChatMessage } from "./messagingTypes";

let socket: Socket | null = null;
let joinedThreadIds: string[] = [];
let joinedUserId: string | null = null;
let lifecycleBound = false;

function bindSocketLifecycle(client: Socket) {
  if (lifecycleBound) return;
  lifecycleBound = true;

  const rejoin = () => {
    if (joinedUserId) {
      client.emit("messaging:join-user", { userId: joinedUserId });
    }
    if (joinedThreadIds.length) {
      client.emit("messaging:join", { threadIds: joinedThreadIds });
    }
  };

  client.on("connect", rejoin);
  client.io.on("reconnect", rejoin);
}

export function getMessagingSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(apiBaseUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    bindSocketLifecycle(socket);
  }
  return socket;
}

export function joinMessagingUserRoom(userId: string) {
  if (!userId) return;
  joinedUserId = userId;
  const client = getMessagingSocket();
  if (!client) return;
  client.emit("messaging:join-user", { userId });
}

export function joinMessagingThreads(threadIds: string[]) {
  const nextIds = threadIds.filter(Boolean);
  if (!nextIds.length) return;
  joinedThreadIds = Array.from(new Set([...joinedThreadIds, ...nextIds]));
  const client = getMessagingSocket();
  if (!client) return;
  client.emit("messaging:join", { threadIds: joinedThreadIds });
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

export function onMessagingMessageDeleted(
  handler: (payload: { threadId: string; messageId: string; scope: string; deletedForEveryone: boolean }) => void,
) {
  const client = getMessagingSocket();
  if (!client) return () => {};
  client.on("messaging:message-deleted", handler);
  return () => {
    client.off("messaging:message-deleted", handler);
  };
}

export type MessagingReadPayload = {
  threadId: string;
  lastReadMessageId: string | null;
  lastReadAt: string | null;
  userId: string;
};

export function onMessagingRead(handler: (payload: MessagingReadPayload) => void) {
  const client = getMessagingSocket();
  if (!client) return () => {};
  client.on("messaging:read", handler);
  return () => {
    client.off("messaging:read", handler);
  };
}
