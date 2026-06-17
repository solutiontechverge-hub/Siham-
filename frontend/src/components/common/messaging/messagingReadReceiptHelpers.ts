import type { MessagingChatMessage, MessagingStore } from "./messagingTypes";
import { getMessageTimestamp } from "./messagingRetention";

export function isMessageReadByPeer(
  message: MessagingChatMessage,
  peerReadAt?: string | null,
): boolean {
  if (message.readByPeer) return true;
  if (!peerReadAt) return false;
  const readMs = new Date(peerReadAt).getTime();
  const messageMs = message.createdAt
    ? new Date(message.createdAt).getTime()
    : getMessageTimestamp(message);
  if (Number.isNaN(readMs) || Number.isNaN(messageMs)) return false;
  return messageMs <= readMs;
}

export function applyPeerReadReceiptToMessage(
  message: MessagingChatMessage,
  isOwn: boolean,
  peerReadAt?: string | null,
): MessagingChatMessage {
  if (!isOwn || message.deletedForEveryone) return message;
  return {
    ...message,
    readByPeer: isMessageReadByPeer(message, peerReadAt),
  };
}

export function applyPeerReadToThreadMessages(
  messages: MessagingChatMessage[],
  peerReadAt?: string | null,
): MessagingChatMessage[] {
  return messages.map((message) =>
    applyPeerReadReceiptToMessage(message, message.senderSide === "self", peerReadAt),
  );
}

export function applyPeerReadToStore(
  store: MessagingStore,
  threadId: string,
  lastReadAt: string,
): MessagingStore {
  const messages = applyPeerReadToThreadMessages(store.messagesByThreadId[threadId] ?? [], lastReadAt);
  return {
    ...store,
    peerLastReadAtByThreadId: {
      ...store.peerLastReadAtByThreadId,
      [threadId]: lastReadAt,
    },
    messagesByThreadId: {
      ...store.messagesByThreadId,
      [threadId]: messages,
    },
  };
}
