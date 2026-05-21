import type { MessagingAudience } from "./messagingRoutes";
import { createInitialMessagingStore } from "./messagingMockData";
import type { MessagingStore } from "./messagingTypes";

const STORAGE_KEY = "mollure:messaging:v1";

export const MESSAGING_UPDATED_EVENT = "mollure:messaging-updated";

export function notifyMessagingUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MESSAGING_UPDATED_EVENT));
}

export function loadMessagingStore(): MessagingStore {
  if (typeof window === "undefined") return createInitialMessagingStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialMessagingStore();
    const parsed = JSON.parse(raw) as MessagingStore;
    if (!parsed?.threads?.length) return createInitialMessagingStore();
    return {
      threads: parsed.threads,
      messagesByThreadId: parsed.messagesByThreadId ?? {},
      hiddenByAudience: parsed.hiddenByAudience ?? {},
      blockedThreadIds: parsed.blockedThreadIds ?? [],
      lastReadMessageIdByAudience: parsed.lastReadMessageIdByAudience ?? {},
    };
  } catch {
    return createInitialMessagingStore();
  }
}

/** Strip blob/data URLs from attachments so localStorage does not crash or exceed quota. */
function sanitizeStoreForPersistence(store: MessagingStore): MessagingStore {
  const messagesByThreadId: MessagingStore["messagesByThreadId"] = {};
  for (const [threadId, messages] of Object.entries(store.messagesByThreadId ?? {})) {
    messagesByThreadId[threadId] = messages.map((msg) => ({
      ...msg,
      attachments: msg.attachments?.map((att) => ({
        id: att.id,
        name: att.name,
        mimeType: att.mimeType ?? "application/octet-stream",
        url: att.url.startsWith("blob:") || att.url.startsWith("data:") ? "" : att.url,
      })),
    }));
  }
  return { ...store, messagesByThreadId };
}

export function saveMessagingStore(store: MessagingStore): boolean {
  if (typeof window === "undefined") return true;
  try {
    const safe = sanitizeStoreForPersistence(store);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    notifyMessagingUpdated();
    return true;
  } catch {
    return false;
  }
}

export function isThreadHiddenForAudience(store: MessagingStore, audience: MessagingAudience, threadId: string) {
  return (store.hiddenByAudience?.[audience] ?? []).includes(threadId);
}

export function hideThreadsForAudience(store: MessagingStore, audience: MessagingAudience, threadIds: string[]): MessagingStore {
  const current = new Set(store.hiddenByAudience?.[audience] ?? []);
  threadIds.forEach((id) => current.add(id));
  return {
    ...store,
    hiddenByAudience: { ...store.hiddenByAudience, [audience]: Array.from(current) },
  };
}

export function normalizeBookingIdQuery(query: string): string {
  return query.trim().replace(/^#/, "").replace(/^b/i, "").toLowerCase();
}

export function threadMatchesSearch(thread: { name: string; bookingId: string; bookingMeta: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const normalizedBooking = normalizeBookingIdQuery(q);
  const threadBooking = normalizeBookingIdQuery(thread.bookingId);
  if (normalizedBooking && (threadBooking.includes(normalizedBooking) || thread.bookingMeta.toLowerCase().includes(q))) {
    return true;
  }
  return thread.name.toLowerCase().includes(q);
}
