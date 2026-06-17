import type { MessagingAudience } from "./messagingRoutes";
import { createInitialMessagingStore } from "./messagingMockData";
import {
  formatConversationTimeLabel,
  getMessageTimestamp,
  getThreadLastActivityIso,
  isMessageWithinRetention,
  withMessageCreatedAt,
} from "./messagingRetention";
import type { MessagingChatMessage, MessagingSettingsFilters, MessagingStore, MessagingThread } from "./messagingTypes";

const STORAGE_KEY = "mollure:messaging:v1";
const PREFS_KEY = "mollure:messaging:prefs:v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isApiBackedStore(store: MessagingStore): boolean {
  return store.threads.some((thread) => UUID_RE.test(thread.id) || thread.id.startsWith("draft:"));
}

export function extractMessagingPrefs(store: MessagingStore) {
  return {
    hiddenByAudience: store.hiddenByAudience ?? {},
    blockedThreadIds: store.blockedThreadIds ?? [],
    lastReadMessageIdByAudience: store.lastReadMessageIdByAudience ?? {},
    presenceStatus: store.presenceStatus ?? "online",
  };
}

export function loadMessagingPrefs() {
  if (typeof window === "undefined") {
    return extractMessagingPrefs(createInitialMessagingStore());
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) return extractMessagingPrefs({ ...createInitialMessagingStore(), ...JSON.parse(raw) });
    const legacy = window.localStorage.getItem(STORAGE_KEY);
    if (legacy) return extractMessagingPrefs(JSON.parse(legacy) as MessagingStore);
  } catch {
    // ignore
  }
  return extractMessagingPrefs(createInitialMessagingStore());
}

export function mergeApiInboxWithPrefs(
  api: Pick<MessagingStore, "threads" | "messagesByThreadId">,
  prefs: ReturnType<typeof extractMessagingPrefs>,
): MessagingStore {
  return filterToRetentionWindow({
    threads: api.threads,
    messagesByThreadId: api.messagesByThreadId,
    hiddenByAudience: prefs.hiddenByAudience,
    blockedThreadIds: prefs.blockedThreadIds,
    lastReadMessageIdByAudience: prefs.lastReadMessageIdByAudience,
    presenceStatus: prefs.presenceStatus,
  });
}

function threadProfessionalKey(thread: MessagingThread): string {
  return thread.professionalUserId || thread.peerProfileId || thread.businessSetupId || thread.id;
}

function mergeMessageLists(
  local: MessagingChatMessage[],
  api: MessagingChatMessage[],
): MessagingChatMessage[] {
  const byId = new Map<string, MessagingChatMessage>();
  for (const message of api) byId.set(message.id, withMessageCreatedAt(message));
  for (const message of local) {
    if (!byId.has(message.id)) byId.set(message.id, withMessageCreatedAt(message));
  }
  return Array.from(byId.values()).sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
}

/** Merge a fresh API inbox into existing client state without dropping local messages or draft threads. */
export function mergeApiInboxIntoStore(
  current: MessagingStore,
  api: Pick<MessagingStore, "threads" | "messagesByThreadId">,
  prefs: ReturnType<typeof extractMessagingPrefs>,
): MessagingStore {
  const apiProfessionalKeys = new Set(api.threads.map(threadProfessionalKey));

  const keptDrafts = current.threads.filter((thread) => {
    if (!thread.id.startsWith("draft:") && !thread.isNewConversation) return false;
    return !apiProfessionalKeys.has(threadProfessionalKey(thread));
  });

  const mergedThreads = [...api.threads, ...keptDrafts];
  const messagesByThreadId: MessagingStore["messagesByThreadId"] = { ...current.messagesByThreadId };

  for (const apiThread of api.threads) {
    const draftKeys = [
      apiThread.businessSetupId ? `draft:setup-${apiThread.businessSetupId}` : null,
      apiThread.peerProfileId ? `draft:setup-${apiThread.peerProfileId}` : null,
      apiThread.professionalUserId ? `draft:${apiThread.professionalUserId}` : null,
    ].filter(Boolean) as string[];

    const draftMessages = draftKeys.flatMap((key) => messagesByThreadId[key] ?? []);
    const localMessages = messagesByThreadId[apiThread.id] ?? [];
    const apiMessages = api.messagesByThreadId[apiThread.id] ?? [];

    messagesByThreadId[apiThread.id] = mergeMessageLists(
      [...draftMessages, ...localMessages],
      apiMessages,
    );

    for (const key of draftKeys) delete messagesByThreadId[key];
  }

  for (const draft of keptDrafts) {
    if (!(draft.id in messagesByThreadId)) {
      messagesByThreadId[draft.id] = current.messagesByThreadId[draft.id] ?? [];
    }
  }

  const threads = mergedThreads.map((thread) =>
    refreshThreadPreview(thread, messagesByThreadId[thread.id] ?? []),
  );

  return filterToRetentionWindow({
    ...current,
    threads,
    messagesByThreadId,
    hiddenByAudience: prefs.hiddenByAudience ?? current.hiddenByAudience,
    blockedThreadIds: prefs.blockedThreadIds ?? current.blockedThreadIds,
    lastReadMessageIdByAudience:
      prefs.lastReadMessageIdByAudience ?? current.lastReadMessageIdByAudience,
    presenceStatus: prefs.presenceStatus ?? current.presenceStatus,
  });
}

export function mapDraftActiveThreadId(currentId: string, apiThreads: MessagingThread[]): string {
  for (const thread of apiThreads) {
    const draftKeys = [
      thread.businessSetupId ? `draft:setup-${thread.businessSetupId}` : null,
      thread.peerProfileId ? `draft:setup-${thread.peerProfileId}` : null,
      thread.professionalUserId ? `draft:${thread.professionalUserId}` : null,
    ].filter((key): key is string => Boolean(key));
    if (draftKeys.includes(currentId)) return thread.id;
  }
  return currentId;
}

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
    const hydrated: MessagingStore = {
      threads: parsed.threads,
      messagesByThreadId: parsed.messagesByThreadId ?? {},
      hiddenByAudience: parsed.hiddenByAudience ?? {},
      blockedThreadIds: parsed.blockedThreadIds ?? [],
      lastReadMessageIdByAudience: parsed.lastReadMessageIdByAudience ?? {},
      presenceStatus: parsed.presenceStatus ?? "online",
    };
    return filterToRetentionWindow(hydrated);
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
    if (isApiBackedStore(store)) {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(extractMessagingPrefs(store)));
      notifyMessagingUpdated();
      return true;
    }
    const safe = sanitizeStoreForPersistence(filterToRetentionWindow(store));
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

function refreshThreadPreview(thread: MessagingThread, messages: MessagingChatMessage[]): MessagingThread {
  const visible = messages.filter((m) => !m.deletedForEveryone);
  const last = visible[visible.length - 1];
  if (!last) {
    return { ...thread, preview: "", lastActivityAt: undefined, timeLabel: "" };
  }
  const lastActivityAt = getThreadLastActivityIso(messages, thread.lastActivityAt);
  return {
    ...thread,
    preview: last.deletedForEveryone ? "Message deleted" : last.body || (last.attachments?.[0]?.name ?? "Attachment"),
    lastActivityAt,
    timeLabel: lastActivityAt ? formatConversationTimeLabel(lastActivityAt) : thread.timeLabel,
  };
}

/** Keep only the last 30 days in local/offline views. Database purges older rows server-side. */
export function filterToRetentionWindow(store: MessagingStore): MessagingStore {
  const messagesByThreadId: MessagingStore["messagesByThreadId"] = {};
  for (const [threadId, messages] of Object.entries(store.messagesByThreadId ?? {})) {
    messagesByThreadId[threadId] = messages.map(withMessageCreatedAt).filter(isMessageWithinRetention);
  }

  const threads = store.threads.map((thread) =>
    refreshThreadPreview(thread, messagesByThreadId[thread.id] ?? []),
  );

  return { ...store, threads, messagesByThreadId };
}

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
