import type { MessagingAudience } from "./messagingRoutes";
import { normalizeBookingIdQuery } from "./messagingStorage";
import type { MessagingChatMessage, MessagingStore, MessagingThread } from "./messagingTypes";

import { MESSAGING_UPDATED_EVENT, notifyMessagingUpdated } from "./messagingStorage";

export { MESSAGING_UPDATED_EVENT, notifyMessagingUpdated };

export function isMessageFromProfessional(msg: MessagingChatMessage): boolean {
  if (msg.senderRole === "professional") return true;
  if (msg.senderRole === "client") return false;
  return msg.senderSide === "peer";
}

export function isMessageFromClient(msg: MessagingChatMessage): boolean {
  if (msg.senderRole === "client") return true;
  if (msg.senderRole === "professional") return false;
  return msg.senderSide === "self";
}

function countUnreadProfessionalInThread(messages: MessagingChatMessage[], lastReadMessageId?: string): number {
  if (!messages.length) return 0;
  let startIndex = 0;
  if (lastReadMessageId) {
    const readIndex = messages.findIndex((m) => m.id === lastReadMessageId);
    startIndex = readIndex >= 0 ? readIndex + 1 : 0;
  }
  return messages.slice(startIndex).filter(isMessageFromProfessional).length;
}

function threadMatchesBookingRef(thread: MessagingThread, bookingRef?: string): boolean {
  if (!bookingRef?.trim()) return true;
  const q = normalizeBookingIdQuery(bookingRef);
  const id = normalizeBookingIdQuery(thread.bookingId);
  return id === q || id.includes(q) || q.includes(id);
}

export function getUnreadFromProfessionalCount(
  store: MessagingStore,
  options?: { bookingRef?: string; threadId?: string },
): number {
  let threads = store.threads.filter((t) => !store.blockedThreadIds.includes(t.id));
  if (options?.threadId) threads = threads.filter((t) => t.id === options.threadId);
  if (options?.bookingRef) threads = threads.filter((t) => threadMatchesBookingRef(t, options.bookingRef));

  const lastRead = store.lastReadMessageIdByAudience?.client ?? {};
  let total = 0;
  for (const thread of threads) {
    const messages = store.messagesByThreadId[thread.id] ?? [];
    total += countUnreadProfessionalInThread(messages, lastRead[thread.id]);
  }
  return total;
}

export function markThreadReadForAudience(
  store: MessagingStore,
  audience: MessagingAudience,
  threadId: string,
): MessagingStore {
  const messages = store.messagesByThreadId[threadId] ?? [];
  const last = messages[messages.length - 1];
  if (!last) return store;

  return {
    ...store,
    lastReadMessageIdByAudience: {
      ...store.lastReadMessageIdByAudience,
      [audience]: {
        ...(store.lastReadMessageIdByAudience?.[audience] ?? {}),
        [threadId]: last.id,
      },
    },
  };
}
