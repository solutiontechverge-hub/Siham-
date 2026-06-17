import type { MessagingStore } from "./messagingTypes";
import { isMessageFromClient } from "./messagingUnread";
import { normalizeBookingIdQuery } from "./messagingStorage";

const BOOKING_REPLY_STATUSES = new Set(["requested", "confirmed", "completed"]);

export function threadHasClientMessage(store: MessagingStore, threadId: string) {
  const messages = store.messagesByThreadId[threadId] ?? [];
  return messages.some(isMessageFromClient);
}

export function threadHasActiveBooking(store: MessagingStore, threadId: string) {
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread) return false;
  return BOOKING_REPLY_STATUSES.has(thread.bookingStatus);
}

/** Professional may reply after client initiates or when a requested/confirmed/completed booking exists. */
export function canProfessionalReply(store: MessagingStore, threadId?: string) {
  if (!threadId) return false;
  return threadHasClientMessage(store, threadId) || threadHasActiveBooking(store, threadId);
}

export function findThreadIdByBookingRef(store: MessagingStore, bookingRef?: string) {
  if (!bookingRef?.trim()) return "";
  const q = normalizeBookingIdQuery(bookingRef);
  const match = store.threads.find((thread) => {
    const id = normalizeBookingIdQuery(thread.bookingId);
    return id === q || id.includes(q) || q.includes(id);
  });
  return match?.id ?? "";
}

export function findThreadIdByClientName(store: MessagingStore, clientName?: string) {
  if (!clientName?.trim()) return "";
  const normalized = clientName.trim().toLowerCase();
  const match = store.threads.find((thread) => thread.name.trim().toLowerCase() === normalized);
  return match?.id ?? "";
}
