import { applyLastMessageToThread, normalizeMessageForAudience } from "./messagingPreview";
import { isMessageWithinRetention, withMessageCreatedAt } from "./messagingRetention";
import { applyMessageRetention } from "./messagingStorage";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage, MessagingStore } from "./messagingTypes";

export type MergeIncomingResult = {
  store: MessagingStore;
  isNew: boolean;
  unknownThread: boolean;
};

export function mergeIncomingSocketMessage(
  store: MessagingStore,
  threadId: string,
  message: MessagingChatMessage,
  audience: MessagingAudience,
  currentUserName: string,
): MergeIncomingResult {
  const threadName = store.threads.find((thread) => thread.id === threadId)?.name ?? "";
  const normalized = normalizeMessageForAudience(
    withMessageCreatedAt(message),
    audience,
    currentUserName,
    threadName,
  );

  if (!isMessageWithinRetention(normalized)) {
    return { store, isNew: false, unknownThread: false };
  }

  if (!store.threads.some((thread) => thread.id === threadId)) {
    return { store, isNew: false, unknownThread: true };
  }

  const local = store.messagesByThreadId[threadId] ?? [];
  if (local.some((item) => item.id === normalized.id)) {
    return { store, isNew: false, unknownThread: false };
  }

  const threadMessages = [...local, normalized];
  const nextThreads = store.threads.map((thread) =>
    thread.id === threadId ? applyLastMessageToThread(thread, normalized, audience, currentUserName) : thread,
  );
  const next = applyMessageRetention({
    ...store,
    threads: nextThreads,
    messagesByThreadId: { ...store.messagesByThreadId, [threadId]: threadMessages },
  });

  return { store: next, isNew: true, unknownThread: false };
}
