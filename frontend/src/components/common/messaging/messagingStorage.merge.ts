import type { MessagingAudience } from "./messagingRoutes";
import { buildThreadPreviewFromMessage } from "./messagingPreview";
import { isMockMessagingThreadId } from "./messagingMockData";
import {
  formatConversationTimeLabel,
  getMessageTimestamp,
  getThreadLastActivityIso,
  isMessageWithinRetention,
  withMessageCreatedAt,
} from "./messagingRetention";
import type { MessagingChatMessage, MessagingStore, MessagingThread } from "./messagingTypes";

export type MessagingPrefs = {
  hiddenByAudience: MessagingStore["hiddenByAudience"];
  blockedThreadIds: string[];
  lastReadMessageIdByAudience: MessagingStore["lastReadMessageIdByAudience"];
  presenceStatus: MessagingStore["presenceStatus"];
};

/** Insert or refresh a thread so booking-open can select it before inbox refetch. */
export function upsertThreadIntoStore(
  store: MessagingStore,
  thread: MessagingThread,
): MessagingStore {
  const existingIdx = store.threads.findIndex((item) => item.id === thread.id);
  const threads = [...store.threads];
  if (existingIdx >= 0) {
    threads[existingIdx] = { ...threads[existingIdx], ...thread };
  } else {
    threads.unshift(thread);
  }
  return {
    ...store,
    threads,
    messagesByThreadId: {
      ...store.messagesByThreadId,
      [thread.id]: store.messagesByThreadId[thread.id] ?? [],
    },
  };
}

/** Keep a locally seeded booking link when the API inbox still reports unlinked. */
function withPreservedBookingLink(
  apiThread: MessagingThread,
  local?: MessagingThread,
): MessagingThread {
  if (!local) return apiThread;
  const localLinked = Boolean(local.bookingId?.trim()) && !local.unlinked;
  const apiLinked = Boolean(apiThread.bookingId?.trim()) && !apiThread.unlinked;
  if (!localLinked || apiLinked) return apiThread;
  return {
    ...apiThread,
    bookingId: local.bookingId,
    bookingMeta: local.bookingMeta,
    bookingStatus: local.bookingStatus,
    unlinked: false,
  };
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

export function refreshThreadPreview(
  thread: MessagingThread,
  messages: MessagingChatMessage[],
  audience?: MessagingAudience,
): MessagingThread {
  const visible = messages.filter((m) => !m.deletedForEveryone);
  const last = visible[visible.length - 1];
  if (!last) {
    return { ...thread, preview: "", previewSenderName: undefined, previewFromPeer: undefined, lastActivityAt: undefined, timeLabel: "" };
  }
  const lastActivityAt = getThreadLastActivityIso(messages, thread.lastActivityAt);
  const previewFields = audience
    ? buildThreadPreviewFromMessage(last, audience, thread.name)
    : {
        preview: last.deletedForEveryone ? "Message deleted" : last.body || (last.attachments?.[0]?.name ?? "Attachment"),
        previewSenderName: last.senderName,
        previewFromPeer: last.senderSide === "peer",
      };
  return {
    ...thread,
    ...previewFields,
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

export function mergeApiInboxWithPrefs(
  api: Pick<MessagingStore, "threads" | "messagesByThreadId" | "peerLastReadAtByThreadId">,
  prefs: MessagingPrefs,
  audience?: MessagingAudience,
): MessagingStore {
  const threads = api.threads.map((thread) =>
    refreshThreadPreview(thread, api.messagesByThreadId[thread.id] ?? [], audience),
  );
  return filterToRetentionWindow({
    threads,
    messagesByThreadId: api.messagesByThreadId,
    peerLastReadAtByThreadId: api.peerLastReadAtByThreadId ?? {},
    hiddenByAudience: prefs.hiddenByAudience,
    blockedThreadIds: prefs.blockedThreadIds,
    lastReadMessageIdByAudience: prefs.lastReadMessageIdByAudience,
    presenceStatus: prefs.presenceStatus,
  });
}

/** Merge a fresh API inbox into existing client state without dropping local messages or draft threads. */
export function mergeApiInboxIntoStore(
  current: MessagingStore,
  api: Pick<MessagingStore, "threads" | "messagesByThreadId" | "peerLastReadAtByThreadId">,
  prefs: MessagingPrefs,
  audience?: MessagingAudience,
): MessagingStore {
  const apiProfessionalKeys = new Set(api.threads.map(threadProfessionalKey));

  // Draft "Tap to start…" professionals are client-only; never carry them into the pro inbox.
  // Also never keep legacy demo seed threads (lissa-j, craig-martha, …).
  const keptDrafts =
    audience === "professional"
      ? []
      : current.threads.filter((thread) => {
          if (isMockMessagingThreadId(thread.id)) return false;
          if (!thread.id.startsWith("draft:") && !thread.isNewConversation) return false;
          return !apiProfessionalKeys.has(threadProfessionalKey(thread));
        });

  const localById = new Map(current.threads.map((thread) => [thread.id, thread]));
  const apiThreads = api.threads
    .filter((thread) => !isMockMessagingThreadId(thread.id))
    .map((thread) => withPreservedBookingLink(thread, localById.get(thread.id)));
  const apiThreadIds = new Set(apiThreads.map((thread) => thread.id));
  const localOnlyThreads =
    audience === "professional"
      ? current.threads.filter(
          (thread) =>
            !thread.id.startsWith("draft:") &&
            !thread.isNewConversation &&
            !isMockMessagingThreadId(thread.id) &&
            !apiThreadIds.has(thread.id),
        )
      : [];
  const mergedThreads = [...apiThreads, ...localOnlyThreads, ...keptDrafts];
  const messagesByThreadId: MessagingStore["messagesByThreadId"] = { ...current.messagesByThreadId };

  for (const apiThread of apiThreads) {
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

  for (const localThread of localOnlyThreads) {
    if (!(localThread.id in messagesByThreadId)) {
      messagesByThreadId[localThread.id] = current.messagesByThreadId[localThread.id] ?? [];
    }
  }

  const threads = mergedThreads.map((thread) =>
    refreshThreadPreview(thread, messagesByThreadId[thread.id] ?? [], audience),
  );

  return filterToRetentionWindow({
    ...current,
    threads,
    messagesByThreadId,
    peerLastReadAtByThreadId: {
      ...current.peerLastReadAtByThreadId,
      ...api.peerLastReadAtByThreadId,
    },
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
