import type { MessagingStore, MessagingThread } from "./messagingTypes";
import { isMessageFromClient } from "./messagingUnread";
import { normalizeBookingIdQuery } from "./messagingStorage";

const BOOKING_REPLY_STATUSES = new Set(["requested", "confirmed", "completed", "in_progress"]);

export function threadHasClientMessage(store: MessagingStore, threadId: string) {
  const messages = store.messagesByThreadId[threadId] ?? [];
  return messages.some(isMessageFromClient);
}

export function threadHasActiveBooking(store: MessagingStore, threadId: string) {
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread) return false;
  // Unlinked / no booking id = no booking-based visibility (do not treat default status as active).
  if (thread.unlinked || !thread.bookingId?.trim()) return false;
  return BOOKING_REPLY_STATUSES.has(thread.bookingStatus);
}

/** Professional may reply after client initiates or when a requested/confirmed/completed booking exists. */
export function canProfessionalReply(store: MessagingStore, threadId?: string) {
  if (!threadId) return false;
  return threadHasClientMessage(store, threadId) || threadHasActiveBooking(store, threadId);
}

export function findThreadIdByBookingRef(store: MessagingStore, bookingRef?: string) {
  if (!bookingRef?.trim()) return "";
  const raw = bookingRef.trim();
  const q = normalizeBookingIdQuery(bookingRef);
  const match = store.threads.find((thread) => {
    const id = normalizeBookingIdQuery(thread.bookingId);
    if (q && (id === q || id.includes(q) || q.includes(id))) return true;
    const meta = thread.bookingMeta.toLowerCase();
    if (meta.includes(raw.toLowerCase())) return true;
    const normalizedMeta = normalizeBookingIdQuery(thread.bookingMeta);
    return Boolean(q && normalizedMeta.includes(q));
  });
  return match?.id ?? "";
}

export function findThreadIdByClientName(store: MessagingStore, clientName?: string) {
  if (!clientName?.trim()) return "";
  const normalized = clientName.trim().toLowerCase();
  const exact = store.threads.find((thread) => thread.name.trim().toLowerCase() === normalized);
  if (exact) return exact.id;
  const partial = store.threads.find((thread) => {
    const threadName = thread.name.trim().toLowerCase();
    return threadName.startsWith(normalized) || normalized.startsWith(threadName);
  });
  return partial?.id ?? "";
}

/** Prefer an existing conversation with this business setup, else its draft thread. */
/** Thread ids that must stay visible when opening chat from a booking deep-link. */
export function collectBookingNavigationThreadIds(
  store: MessagingStore,
  navigation?: {
    threadId?: string;
    bookingRef?: string;
    seedThread?: MessagingThread;
  },
): Set<string> {
  const ids = new Set<string>();
  if (!navigation) return ids;

  const threadRef = navigation.threadId?.trim();
  if (threadRef) ids.add(threadRef);

  const seedId = navigation.seedThread?.id?.trim();
  if (seedId) ids.add(seedId);

  const bookingRef = navigation.bookingRef?.trim();
  if (bookingRef) {
    const byBooking = findThreadIdByBookingRef(store, bookingRef);
    if (byBooking) ids.add(byBooking);
  }

  return ids;
}

export function findThreadIdByBusinessSetupId(
  store: MessagingStore,
  businessSetupId?: string,
) {
  if (!businessSetupId?.trim()) return "";
  const setupId = businessSetupId.trim();
  const existing = store.threads.find(
    (thread) =>
      !thread.isNewConversation &&
      (thread.businessSetupId === setupId || thread.peerProfileId === setupId),
  );
  if (existing) return existing.id;
  const draft = store.threads.find(
    (thread) =>
      thread.businessSetupId === setupId ||
      thread.peerProfileId === setupId ||
      thread.id === `draft:setup-${setupId}`,
  );
  return draft?.id ?? "";
}
