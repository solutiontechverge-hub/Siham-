import { createEmptyMessagingStore } from "./messagingMockData";
import type { MessagingStore } from "./messagingTypes";
import {
  filterToRetentionWindow,
  mergeApiInboxWithPrefs,
  type MessagingPrefs,
} from "./messagingStorage.merge";
import {
  getUiPrefsSnapshot,
  patchUiPrefs,
} from "../../../lib/uiPrefsStore";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isApiBackedStore(store: MessagingStore): boolean {
  return store.threads.some((thread) => UUID_RE.test(thread.id) || thread.id.startsWith("draft:"));
}

export function extractMessagingPrefs(store: MessagingStore): MessagingPrefs {
  return {
    hiddenByAudience: store.hiddenByAudience ?? {},
    blockedThreadIds: store.blockedThreadIds ?? [],
    lastReadMessageIdByAudience: store.lastReadMessageIdByAudience ?? {},
    presenceStatus: store.presenceStatus ?? "online",
  };
}

export function loadMessagingPrefs(): MessagingPrefs {
  const fromApi = getUiPrefsSnapshot().messagingPrefs;
  if (fromApi && typeof fromApi === "object") {
    return extractMessagingPrefs({
      ...createEmptyMessagingStore(),
      ...fromApi,
    } as MessagingStore);
  }
  return extractMessagingPrefs(createEmptyMessagingStore());
}

export const MESSAGING_UPDATED_EVENT = "mollure:messaging-updated";

export function notifyMessagingUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MESSAGING_UPDATED_EVENT));
}

/** Session-only runtime snapshot (no durable localStorage). */
let runtimeSnapshot: Pick<
  MessagingStore,
  "threads" | "messagesByThreadId" | "peerLastReadAtByThreadId"
> | null = null;

export function loadMessagingRuntimeSnapshot(): Pick<
  MessagingStore,
  "threads" | "messagesByThreadId" | "peerLastReadAtByThreadId"
> | null {
  return runtimeSnapshot;
}

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
  const safe = sanitizeStoreForPersistence(filterToRetentionWindow(store));
  runtimeSnapshot = {
    threads: safe.threads,
    messagesByThreadId: safe.messagesByThreadId,
    peerLastReadAtByThreadId: safe.peerLastReadAtByThreadId ?? {},
  };
  notifyMessagingUpdated();
}

export function loadMessagingStore(): MessagingStore {
  const runtime = loadMessagingRuntimeSnapshot();
  const prefs = loadMessagingPrefs();
  if (runtime) return mergeApiInboxWithPrefs(runtime, prefs);
  return createEmptyMessagingStore();
}

export function saveMessagingStore(store: MessagingStore): boolean {
  try {
    patchUiPrefs({
      messagingPrefs: extractMessagingPrefs(store) as unknown as Record<
        string,
        unknown
      >,
    });
    if (isApiBackedStore(store)) {
      saveMessagingRuntimeSnapshot(store);
    } else {
      const safe = sanitizeStoreForPersistence(filterToRetentionWindow(store));
      runtimeSnapshot = {
        threads: safe.threads,
        messagesByThreadId: safe.messagesByThreadId,
        peerLastReadAtByThreadId: safe.peerLastReadAtByThreadId ?? {},
      };
      notifyMessagingUpdated();
    }
    return true;
  } catch {
    return false;
  }
}
