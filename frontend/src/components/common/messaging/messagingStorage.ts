import { createEmptyMessagingStore, isMockMessagingThreadId } from "./messagingMockData";
import type { MessagingStore } from "./messagingTypes";
import {
  filterToRetentionWindow,
  mergeApiInboxIntoStore,
  mergeApiInboxWithPrefs,
  type MessagingPrefs,
} from "./messagingStorage.merge";

export {
  upsertThreadIntoStore,
  mergeApiInboxWithPrefs,
  mergeApiInboxIntoStore,
  mapDraftActiveThreadId,
  filterToRetentionWindow,
  refreshThreadPreview,
} from "./messagingStorage.merge";
export type { MessagingPrefs } from "./messagingStorage.merge";

export {
  applyMessageRetention,
  applyAutoDeleteSettings,
  filterVisibleMessages,
  isThreadHiddenForAudience,
  hideThreadsForAudience,
  deleteMessagesForEveryone,
  deleteMessagesForMe,
  applyMessageDelete,
  applyClearChat,
  replaceThreadIdInStore,
  normalizeBookingIdQuery,
  threadMatchesSearch,
} from "./messagingStorage.mutations";

const STORAGE_KEY = "mollure:messaging:v1";
const PREFS_KEY = "mollure:messaging:prefs:v1";
const RUNTIME_KEY = "mollure:messaging:runtime:v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isApiBackedStore(store: MessagingStore): boolean {
  return store.threads.some((thread) => UUID_RE.test(thread.id) || thread.id.startsWith("draft:"));
}

function stripMockThreads(store: MessagingStore): MessagingStore {
  const threads = store.threads.filter((thread) => !isMockMessagingThreadId(thread.id));
  if (threads.length === store.threads.length) return store;
  const messagesByThreadId: MessagingStore["messagesByThreadId"] = {};
  for (const thread of threads) {
    messagesByThreadId[thread.id] = store.messagesByThreadId[thread.id] ?? [];
  }
  return { ...store, threads, messagesByThreadId };
}

export function extractMessagingPrefs(store: MessagingStore): MessagingPrefs {
  return {
    hiddenByAudience: store.hiddenByAudience ?? {},
    blockedThreadIds: store.blockedThreadIds ?? [],
    lastReadMessageIdByAudience: store.lastReadMessageIdByAudience ?? {},
    presenceStatus: store.presenceStatus ?? "online",
  };
}

export function loadMessagingPrefs() {
  if (typeof window === "undefined") {
    return extractMessagingPrefs(createEmptyMessagingStore());
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) return extractMessagingPrefs({ ...createEmptyMessagingStore(), ...JSON.parse(raw) });
    const legacy = window.localStorage.getItem(STORAGE_KEY);
    if (legacy) return extractMessagingPrefs(JSON.parse(legacy) as MessagingStore);
  } catch {
    // ignore
  }
  return extractMessagingPrefs(createEmptyMessagingStore());
}

export const MESSAGING_UPDATED_EVENT = "mollure:messaging-updated";

export function notifyMessagingUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MESSAGING_UPDATED_EVENT));
}

export function loadMessagingRuntimeSnapshot(): Pick<
  MessagingStore,
  "threads" | "messagesByThreadId" | "peerLastReadAtByThreadId"
> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RUNTIME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pick<MessagingStore, "threads" | "messagesByThreadId" | "peerLastReadAtByThreadId">;
    if (!parsed?.threads?.length) return null;
    return {
      threads: parsed.threads,
      messagesByThreadId: parsed.messagesByThreadId ?? {},
      peerLastReadAtByThreadId: parsed.peerLastReadAtByThreadId ?? {},
    };
  } catch {
    return null;
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

export function saveMessagingRuntimeSnapshot(store: MessagingStore): void {
  if (typeof window === "undefined") return;
  try {
    const safe = sanitizeStoreForPersistence(filterToRetentionWindow(store));
    window.localStorage.setItem(
      RUNTIME_KEY,
      JSON.stringify({
        threads: safe.threads,
        messagesByThreadId: safe.messagesByThreadId,
        peerLastReadAtByThreadId: safe.peerLastReadAtByThreadId ?? {},
      }),
    );
    notifyMessagingUpdated();
  } catch {
    // ignore quota errors
  }
}

export function loadMessagingStore(): MessagingStore {
  if (typeof window === "undefined") return createEmptyMessagingStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const runtime = loadMessagingRuntimeSnapshot();
    const prefs = loadMessagingPrefs();

    if (!raw) {
      if (runtime) {
        return mergeApiInboxWithPrefs(runtime, prefs);
      }
      return createEmptyMessagingStore();
    }

    const parsed = JSON.parse(raw) as MessagingStore;
    // Drop legacy demo seeds (Lissa J / Craig Martha / …) so they never poison the real inbox.
    if (parsed?.threads?.some((thread) => isMockMessagingThreadId(thread.id))) {
      window.localStorage.removeItem(STORAGE_KEY);
      if (runtime) return mergeApiInboxWithPrefs(runtime, prefs);
      return createEmptyMessagingStore();
    }

    if (!parsed?.threads?.length) {
      if (runtime) {
        return mergeApiInboxWithPrefs(runtime, prefs);
      }
      return createEmptyMessagingStore();
    }

    let hydrated: MessagingStore = {
      threads: parsed.threads,
      messagesByThreadId: parsed.messagesByThreadId ?? {},
      hiddenByAudience: parsed.hiddenByAudience ?? {},
      blockedThreadIds: parsed.blockedThreadIds ?? [],
      lastReadMessageIdByAudience: parsed.lastReadMessageIdByAudience ?? {},
      peerLastReadAtByThreadId: parsed.peerLastReadAtByThreadId ?? {},
      presenceStatus: parsed.presenceStatus ?? "online",
    };
    hydrated = stripMockThreads(filterToRetentionWindow(hydrated));

    if (runtime) {
      hydrated = mergeApiInboxIntoStore(hydrated, runtime, prefs);
    }

    return hydrated;
  } catch {
    const runtime = loadMessagingRuntimeSnapshot();
    if (runtime) {
      return mergeApiInboxWithPrefs(runtime, loadMessagingPrefs());
    }
    return createEmptyMessagingStore();
  }
}

export function saveMessagingStore(store: MessagingStore): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (isApiBackedStore(store)) {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(extractMessagingPrefs(store)));
      saveMessagingRuntimeSnapshot(store);
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
