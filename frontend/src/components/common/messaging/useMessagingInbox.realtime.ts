"use client";

import * as React from "react";
import { mergeIncomingSocketMessage } from "./messagingIncomingMessage";
import { applyPeerReadToStore } from "./messagingReadReceiptHelpers";
import { MESSAGING_UPDATED_EVENT } from "./messagingUnread";
import {
  fetchMessagingHistory,
  joinMessagingThreads,
  joinMessagingUserRoom,
  onMessagingMessage,
  onMessagingMessageDeleted,
  onMessagingRead,
} from "./messagingSocketClient";
import {
  applyMessageDelete,
  isApiBackedStore,
  loadMessagingPrefs,
  loadMessagingRuntimeSnapshot,
  mergeApiInboxIntoStore,
  mergeApiInboxWithPrefs,
  saveMessagingStore,
  upsertThreadIntoStore,
} from "./messagingStorage";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage, MessagingStore, MessagingThread } from "./messagingTypes";
import { mergeRemoteMessages } from "./useMessagingInbox.helpers";

export function useMessagingInboxRealtime(deps: {
  audience: MessagingAudience;
  isAuthed: boolean;
  currentUserId: string;
  currentUserName: string;
  activeThreadId: string;
  store: MessagingStore | null;
  seedThread?: MessagingThread;
  refetchInbox: () => void;
  setStore: React.Dispatch<React.SetStateAction<MessagingStore | null>>;
}) {
  const {
    audience,
    isAuthed,
    currentUserId,
    currentUserName,
    activeThreadId,
    store,
    seedThread,
    refetchInbox,
    setStore,
  } = deps;

  React.useEffect(() => {
    if (!isAuthed) return;
    const onExternalUpdate = () => {
      setStore((prev) => {
        const runtime = loadMessagingRuntimeSnapshot();
        if (!runtime) return prev;
        const applySeed = (base: MessagingStore) =>
          seedThread ? upsertThreadIntoStore(base, seedThread) : base;
        if (!prev) return applySeed(mergeApiInboxWithPrefs(runtime, loadMessagingPrefs(), audience));
        return applySeed(mergeApiInboxIntoStore(prev, runtime, loadMessagingPrefs(), audience));
      });
    };
    window.addEventListener(MESSAGING_UPDATED_EVENT, onExternalUpdate);
    return () => window.removeEventListener(MESSAGING_UPDATED_EVENT, onExternalUpdate);
  }, [audience, isAuthed, seedThread, setStore]);

  const threadIdsKey = store?.threads.map((thread) => thread.id).join("|") ?? "";

  React.useEffect(() => {
    if (!currentUserId || !isAuthed) return;
    joinMessagingUserRoom(currentUserId);
  }, [currentUserId, isAuthed]);

  React.useEffect(() => {
    if (!activeThreadId || !isAuthed) return;
    joinMessagingThreads([activeThreadId]);
  }, [activeThreadId, isAuthed]);

  React.useEffect(() => {
    if (!store || !isAuthed) return;
    const threadIds = store.threads.map((thread) => thread.id);
    joinMessagingThreads(threadIds);

    const mergeIncomingMessage = (threadId: string, message: MessagingChatMessage) => {
      setStore((prev) => {
        if (!prev) return prev;
        const result = mergeIncomingSocketMessage(prev, threadId, message, audience, currentUserName);
        if (result.unknownThread) {
          void refetchInbox();
          return prev;
        }
        if (!result.isNew) return prev;
        saveMessagingStore(result.store);
        return result.store;
      });
    };

    const offMessage = onMessagingMessage(({ threadId, message }) => {
      mergeIncomingMessage(threadId, message);
    });

    const offDeleted = onMessagingMessageDeleted(({ threadId, messageId, deletedForEveryone }) => {
      setStore((prev) => {
        if (!prev) return prev;
        const scope = deletedForEveryone ? "everyone" : "me";
        const next = applyMessageDelete(prev, audience, threadId, messageId, scope);
        saveMessagingStore(next);
        return next;
      });
    });

    const offRead = onMessagingRead((payload) => {
      if (!payload.threadId || !payload.lastReadAt) return;
      if (payload.userId && currentUserId && payload.userId === currentUserId) return;
      setStore((prev) => {
        if (!prev) return prev;
        const next = applyPeerReadToStore(prev, payload.threadId, payload.lastReadAt!);
        saveMessagingStore(next);
        return next;
      });
    });

    return () => {
      offMessage();
      offDeleted();
      offRead();
    };
  }, [audience, currentUserId, currentUserName, isAuthed, refetchInbox, setStore, threadIdsKey]);

  React.useEffect(() => {
    if (!store || !isAuthed || isApiBackedStore(store)) return;

    const threadIds = store.threads.map((thread) => thread.id);
    threadIds.forEach(async (threadId) => {
      const remoteMessages = await fetchMessagingHistory(threadId);
      if (!remoteMessages.length) return;
      setStore((prev) => {
        if (!prev) return prev;
        const merged = mergeRemoteMessages(prev, threadId, remoteMessages);
        saveMessagingStore(merged);
        return merged;
      });
    });
  }, [isAuthed, setStore, store, threadIdsKey]);
}
