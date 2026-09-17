import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage, MessagingSettingsFilters, MessagingStore } from "./messagingTypes";
import { filterToRetentionWindow, refreshThreadPreview } from "./messagingStorage.merge";

/** @deprecated Use filterToRetentionWindow */
export const applyMessageRetention = filterToRetentionWindow;

/** Auto-delete messages in threads that match enabled booking-status settings. */
export function applyAutoDeleteSettings(store: MessagingStore, settings: MessagingSettingsFilters): MessagingStore {
  const anyEnabled = Object.values(settings).some(Boolean);
  if (!anyEnabled) return store;

  const messagesByThreadId = { ...store.messagesByThreadId };
  for (const thread of store.threads) {
    const shouldDelete =
      (settings.completed && thread.bookingStatus === "completed") ||
      (settings.cancelled && thread.bookingStatus === "cancelled") ||
      (settings.invalid && thread.bookingStatus === "invalid") ||
      (settings.no_show && thread.bookingStatus === "no_show") ||
      (settings.unlinked && Boolean(thread.unlinked));

    if (shouldDelete) {
      messagesByThreadId[thread.id] = [];
    }
  }

  const threads = store.threads.map((thread) =>
    refreshThreadPreview(thread, messagesByThreadId[thread.id] ?? []),
  );

  return applyMessageRetention({ ...store, threads, messagesByThreadId });
}

export function filterVisibleMessages(
  messages: MessagingChatMessage[],
  audience: MessagingAudience,
): MessagingChatMessage[] {
  return messages.filter((message) => {
    if (message.deletedForEveryone) return true;
    if (message.hiddenForAudience?.[audience]) return false;
    return true;
  });
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

export function deleteMessagesForEveryone(store: MessagingStore, threadId: string): MessagingStore {
  const messages = (store.messagesByThreadId[threadId] ?? []).map((message) => ({
    ...message,
    deletedForEveryone: true,
    body: "",
    attachments: undefined,
  }));
  const messagesByThreadId = { ...store.messagesByThreadId, [threadId]: messages };
  const threads = store.threads.map((thread) =>
    thread.id === threadId ? refreshThreadPreview(thread, messages) : thread,
  );
  return { ...store, threads, messagesByThreadId };
}

export function deleteMessagesForMe(
  store: MessagingStore,
  audience: MessagingAudience,
  threadId: string,
): MessagingStore {
  const messages = (store.messagesByThreadId[threadId] ?? []).map((message) => ({
    ...message,
    hiddenForAudience: { ...message.hiddenForAudience, [audience]: true },
  }));
  return hideThreadsForAudience({ ...store, messagesByThreadId: { ...store.messagesByThreadId, [threadId]: messages } }, audience, [threadId]);
}

export function applyMessageDelete(
  store: MessagingStore,
  audience: MessagingAudience,
  threadId: string,
  messageId: string,
  scope: "me" | "everyone",
): MessagingStore {
  const messages = (store.messagesByThreadId[threadId] ?? []).map((message) => {
    if (message.id !== messageId) return message;
    if (scope === "everyone") {
      return { ...message, deletedForEveryone: true, body: "", attachments: undefined };
    }
    return { ...message, hiddenForAudience: { ...message.hiddenForAudience, [audience]: true } };
  });

  const threads = store.threads.map((thread) =>
    thread.id === threadId ? refreshThreadPreview(thread, messages.filter((m) => !m.hiddenForAudience?.[audience])) : thread,
  );

  return { ...store, threads, messagesByThreadId: { ...store.messagesByThreadId, [threadId]: messages } };
}

export function applyClearChat(
  store: MessagingStore,
  audience: MessagingAudience,
  threadId: string,
  scope: "me" | "everyone",
): MessagingStore {
  const messages = (store.messagesByThreadId[threadId] ?? []).map((message) => {
    if (scope === "everyone") {
      return { ...message, deletedForEveryone: true, body: "", attachments: undefined };
    }
    return { ...message, hiddenForAudience: { ...message.hiddenForAudience, [audience]: true } };
  });

  const visibleMessages =
    scope === "everyone" ? messages : messages.filter((m) => !m.hiddenForAudience?.[audience]);

  const threads = store.threads.map((thread) => {
    if (thread.id !== threadId) return thread;
    const refreshed = refreshThreadPreview(thread, visibleMessages);
    if (refreshed.preview) return refreshed;
    return {
      ...refreshed,
      preview: thread.isNewConversation ? "Tap to start a conversation" : "",
    };
  });

  return { ...store, threads, messagesByThreadId: { ...store.messagesByThreadId, [threadId]: messages } };
}

export function replaceThreadIdInStore(store: MessagingStore, oldThreadId: string, newThreadId: string): MessagingStore {
  if (oldThreadId === newThreadId) return store;
  const messagesByThreadId = { ...store.messagesByThreadId };
  messagesByThreadId[newThreadId] = messagesByThreadId[oldThreadId] ?? [];
  delete messagesByThreadId[oldThreadId];

  const hiddenByAudience = Object.fromEntries(
    Object.entries(store.hiddenByAudience ?? {}).map(([aud, ids]) => [
      aud,
      (ids ?? []).map((id) => (id === oldThreadId ? newThreadId : id)),
    ]),
  );

  const lastReadMessageIdByAudience = Object.fromEntries(
    Object.entries(store.lastReadMessageIdByAudience ?? {}).map(([aud, map]) => [
      aud,
      Object.fromEntries(Object.entries(map ?? {}).map(([id, msgId]) => [id === oldThreadId ? newThreadId : id, msgId])),
    ]),
  );

  const threads = store.threads.map((thread) =>
    thread.id === oldThreadId
      ? {
          ...thread,
          id: newThreadId,
          isNewConversation: false,
        }
      : thread,
  );

  return {
    ...store,
    threads,
    messagesByThreadId,
    hiddenByAudience,
    lastReadMessageIdByAudience,
    blockedThreadIds: store.blockedThreadIds.map((id) => (id === oldThreadId ? newThreadId : id)),
  };
}

export function normalizeBookingIdQuery(query: string): string {
  return query
    .trim()
    .replace(/^#/, "")
    .replace(/^bk-?/i, "")
    .replace(/^b/i, "")
    .toLowerCase();
}

export function threadMatchesSearch(
  thread: { name: string; bookingId: string; bookingMeta: string; peerEmail?: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const normalizedBooking = normalizeBookingIdQuery(q);
  const threadBooking = normalizeBookingIdQuery(thread.bookingId);
  if (normalizedBooking && (threadBooking.includes(normalizedBooking) || thread.bookingMeta.toLowerCase().includes(q))) {
    return true;
  }
  if (thread.peerEmail?.toLowerCase().includes(q)) return true;
  return thread.name.toLowerCase().includes(q);
}
