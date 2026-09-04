"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../store/hooks";
import { getPersistedAuthSession } from "../../../lib/auth-storage";
import { useGetAllBusinessSetupsQuery } from "../../../store/services/businessApi";
import {
  useClearMessagingThreadMutation,
  useDeleteMessagingMessageMutation,
  useGetMessagingInboxQuery,
  useLazyGetMessagingProfessionalsQuery,
  useLinkMessagingThreadToBookingMutation,
  useMarkMessagingThreadReadMutation,
  useSendMessagingMessageMutation,
} from "../../../store/services/messagingApi";
import { useSnackbar } from "../AppSnackbar";
import type { LinkableBooking } from "./messagingBookingsMock";
import { formatLinkableBookingLabel } from "./messagingBookingsMock";
import { formatMessageTimeLabel, todayDateKey } from "./messagingMockData";
import { uploadMessagingAttachments, resolveMessagingAttachments } from "./messagingAttachmentUpload";
import { mergeIncomingSocketMessage } from "./messagingIncomingMessage";
import { applyLastMessageToThread, isMessageOwn, normalizeMessageForAudience } from "./messagingPreview";
import { applyPeerReadReceiptToMessage, applyPeerReadToStore } from "./messagingReadReceiptHelpers";
import { formatConversationTimeLabel, getMessageTimestamp, isMessageWithinRetention, withMessageCreatedAt } from "./messagingRetention";
import type { MessagingReportPayload } from "./messagingReportReasons";
import {
  getUnreadFromClientCount,
  isMessageFromClient,
  markThreadReadForAudience,
  MESSAGING_UPDATED_EVENT,
} from "./messagingUnread";
import {
  emitMessagingSend,
  fetchMessagingHistory,
  joinMessagingThreads,
  joinMessagingUserRoom,
  onMessagingMessage,
  onMessagingMessageDeleted,
  onMessagingRead,
} from "./messagingSocketClient";
import {
  canProfessionalReply,
  collectBookingNavigationThreadIds,
  findThreadIdByBookingRef,
  findThreadIdByBusinessSetupId,
  findThreadIdByClientName,
  threadHasActiveBooking,
} from "./messagingThreadAccess";
import {
  applyAutoDeleteSettings,
  applyClearChat,
  applyMessageDelete,
  applyMessageRetention,
  filterVisibleMessages,
  isApiBackedStore,
  loadMessagingPrefs,
  loadMessagingStore,
  loadMessagingRuntimeSnapshot,
  mergeApiInboxIntoStore,
  mergeApiInboxWithPrefs,
  mapDraftActiveThreadId,
  replaceThreadIdInStore,
  threadMatchesSearch,
  hideThreadsForAudience,
  isThreadHiddenForAudience,
  saveMessagingStore,
  upsertThreadIntoStore,
} from "./messagingStorage";
import {
  CLIENT_PROFESSIONALS_PAGE_SIZE,
  mergeClientThreadsWithProfessionals,
  type MessagingProfessionalListItem,
} from "./messagingProfessionals";
import { createEmptyMessagingStore, isMockMessagingThreadId } from "./messagingMockData";
import { threadPassesDrawerFilters } from "./messagingFilters";
import type { MessagingAudience } from "./messagingRoutes";
import type {
  MessagingAttachment,
  MessagingChatMessage,
  MessagingDrawerFilters,
  MessagingPresenceStatus,
  MessagingSettingsFilters,
  MessagingStore,
  MessagingThread,
} from "./messagingTypes";
import { defaultDrawerFilters, defaultSettingsFilters } from "./messagingTypes";

function groupMessagesByDate(messages: MessagingChatMessage[]) {
  const groups: { dateLabel: string; dateKey: string; messages: MessagingChatMessage[] }[] = [];
  const map = new Map<string, MessagingChatMessage[]>();
  for (const msg of messages) {
    const list = map.get(msg.dateKey) ?? [];
    list.push(msg);
    map.set(msg.dateKey, list);
  }
  for (const [dateKey, msgs] of map) {
    const d = new Date(dateKey);
    const dateLabel = Number.isNaN(d.getTime())
      ? dateKey
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    groups.push({ dateKey, dateLabel, messages: msgs });
  }
  groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return groups;
}

function mergeRemoteMessages(
  store: MessagingStore,
  threadId: string,
  remoteMessages: MessagingChatMessage[],
): MessagingStore {
  if (!remoteMessages.length) return store;
  const local = store.messagesByThreadId[threadId] ?? [];
  const merged = [...local];
  for (const message of remoteMessages) {
    const normalized = withMessageCreatedAt(message);
    if (!merged.some((item) => item.id === normalized.id)) merged.push(normalized);
  }
  merged.sort((a, b) => a.id.localeCompare(b.id));
  const retained = merged.filter(isMessageWithinRetention);
  return applyMessageRetention({
    ...store,
    messagesByThreadId: { ...store.messagesByThreadId, [threadId]: retained },
  });
}

export type MessagingInboxNavigation = {
  bookingRef?: string;
  threadId?: string;
  businessSetupId?: string;
  searchPrefill?: string;
  seedThread?: MessagingThread;
};

export function useMessagingInbox(
  audience: MessagingAudience,
  navigation?: MessagingInboxNavigation,
  currentUserName = "",
) {
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUserId = useAppSelector((state) => state.auth.user?.id ?? "");
  const [persistedToken, setPersistedToken] = React.useState<string | null>(null);
  const isAuthed = Boolean(accessToken || persistedToken);

  React.useEffect(() => {
    setPersistedToken(getPersistedAuthSession()?.accessToken ?? null);
  }, [accessToken]);

  const { data: apiInbox, isSuccess: apiInboxLoaded, refetch: refetchInbox } = useGetMessagingInboxQuery(undefined, {
    skip: !isAuthed,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [fetchProfessionals] = useLazyGetMessagingProfessionalsQuery();
  const { data: businessSetups } = useGetAllBusinessSetupsQuery(undefined, { skip: !isAuthed || audience !== "client" });
  const [sendMessagingMessage] = useSendMessagingMessageMutation();
  const [deleteMessagingMessage] = useDeleteMessagingMessageMutation();
  const [clearMessagingThread] = useClearMessagingThreadMutation();
  const [markMessagingThreadRead] = useMarkMessagingThreadReadMutation();
  const [linkMessagingThreadToBooking] = useLinkMessagingThreadToBookingMutation();
  const [store, setStore] = React.useState<MessagingStore | null>(null);
  const [search, setSearch] = React.useState("");
  const [activeThreadId, setActiveThreadId] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);
  const [settingsFilters, setSettingsFilters] = React.useState<MessagingSettingsFilters>(defaultSettingsFilters);
  const [drawerFilters, setDrawerFilters] = React.useState<MessagingDrawerFilters>(defaultDrawerFilters);
  const [appliedDrawerFilters, setAppliedDrawerFilters] = React.useState<MessagingDrawerFilters>(defaultDrawerFilters);
  const [listVisibleCount, setListVisibleCount] = React.useState(CLIENT_PROFESSIONALS_PAGE_SIZE);
  const [professionalsHasMore, setProfessionalsHasMore] = React.useState(false);
  const [professionalsOffset, setProfessionalsOffset] = React.useState(0);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const professionalsLoadedRef = React.useRef(false);
  const inboxHydratingRef = React.useRef(false);
  const inboxHydratedRef = React.useRef(false);

  React.useEffect(() => {
    setListVisibleCount(CLIENT_PROFESSIONALS_PAGE_SIZE);
    professionalsLoadedRef.current = false;
    setProfessionalsOffset(0);
  }, [search, audience]);

  const mergeProfessionalsIntoStore = React.useCallback(
    (base: MessagingStore, professionals: MessagingProfessionalListItem[]) => {
      const mergedThreads = mergeClientThreadsWithProfessionals(base.threads, professionals);
      const messagesByThreadId = { ...base.messagesByThreadId };
      for (const thread of mergedThreads) {
        if (!(thread.id in messagesByThreadId)) messagesByThreadId[thread.id] = [];
      }
      return { ...base, threads: mergedThreads, messagesByThreadId };
    },
    [],
  );

  const loadProfessionalsPage = React.useCallback(
    async (baseStore: MessagingStore, offset: number, searchQuery: string) => {
      try {
        const page = await fetchProfessionals({
          offset,
          limit: CLIENT_PROFESSIONALS_PAGE_SIZE,
          q: searchQuery,
        }).unwrap();
        setProfessionalsHasMore(page.hasMore);
        setProfessionalsOffset(offset + page.professionals.length);
        return mergeProfessionalsIntoStore(baseStore, page.professionals);
      } catch {
        return baseStore;
      }
    },
    [fetchProfessionals, mergeProfessionalsIntoStore],
  );

  const buildFromSetups = React.useCallback(
    (base: MessagingStore) => {
      if (!businessSetups?.data?.length) return base;
      const professionals: MessagingProfessionalListItem[] = businessSetups.data.map((setup) => ({
        id: setup.id,
        professionalUserId: setup.professionalProfileId ?? setup.id,
        businessSetupId: setup.id,
        name: setup.businessName || setup.salonName || "Professional",
        email: undefined,
        locationType: setup.locationMode === "desired" ? "desired" : "fixed",
        avatarSeed: setup.id,
      }));
      return mergeProfessionalsIntoStore(base, professionals);
    },
    [businessSetups?.data, mergeProfessionalsIntoStore],
  );

  React.useEffect(() => {
    if (!isAuthed || !apiInboxLoaded || !apiInbox) return;

    if (inboxHydratedRef.current) {
      setStore((prev) => {
        if (!prev) return mergeApiInboxWithPrefs(apiInbox, loadMessagingPrefs(), audience);
        const merged = mergeApiInboxIntoStore(prev, apiInbox, loadMessagingPrefs(), audience);
        saveMessagingStore(merged);
        return merged;
      });
      setActiveThreadId((prev) => mapDraftActiveThreadId(prev, apiInbox.threads));
      return;
    }

    if (inboxHydratingRef.current) return;
    inboxHydratingRef.current = true;

    const load = async () => {
      try {
        let merged = mergeApiInboxWithPrefs(apiInbox, loadMessagingPrefs(), audience);
        if (audience === "client" && !professionalsLoadedRef.current) {
          professionalsLoadedRef.current = true;
          merged = await loadProfessionalsPage(merged, 0, "");
          if (!merged.threads.some((t) => t.isNewConversation)) {
            merged = buildFromSetups(merged);
            setProfessionalsHasMore((businessSetups?.data?.length ?? 0) > CLIENT_PROFESSIONALS_PAGE_SIZE);
          }
        }
        setStore(merged);
        saveMessagingStore(merged);
        inboxHydratedRef.current = true;
        if (merged.threads[0]) setActiveThreadId((prev) => prev || merged.threads[0].id);
      } finally {
        inboxHydratingRef.current = false;
      }
    };
    void load();
  }, [
    apiInbox,
    apiInboxLoaded,
    audience,
    buildFromSetups,
    businessSetups?.data?.length,
    isAuthed,
    loadProfessionalsPage,
  ]);

  React.useEffect(() => {
    if (isAuthed) return;
    let loaded = applyMessageRetention(loadMessagingStore());
    if (audience === "client") loaded = buildFromSetups(loaded);
    setStore(loaded);
    if (loaded.threads[0]) setActiveThreadId((prev) => prev || loaded.threads[0].id);
  }, [audience, buildFromSetups, isAuthed]);

  React.useEffect(() => {
    if (!isAuthed || audience !== "client" || !store || !businessSetups?.data?.length) return;
    if (store.threads.some((t) => t.isNewConversation || t.id.startsWith("draft:"))) return;

    const merged = buildFromSetups(store);
    if (merged.threads.length === store.threads.length) return;

    setStore(merged);
    setProfessionalsHasMore(businessSetups.data.length > CLIENT_PROFESSIONALS_PAGE_SIZE);
  }, [audience, buildFromSetups, businessSetups?.data, isAuthed, store]);

  React.useEffect(() => {
    if (!store) return;
    const bookingRef = navigation?.bookingRef ?? searchParams.get("booking") ?? "";
    const threadRef = navigation?.threadId ?? searchParams.get("thread") ?? "";
    const businessSetupId =
      navigation?.businessSetupId ?? searchParams.get("setup") ?? "";
    const searchPrefill =
      navigation?.searchPrefill ??
      searchParams.get("client") ??
      searchParams.get("professional") ??
      "";
    const seedThread = navigation?.seedThread;

    let workingStore = store;
    if (seedThread) {
      const existing = store.threads.find((item) => item.id === seedThread.id);
      const needsUpsert =
        !existing ||
        existing.bookingId !== seedThread.bookingId ||
        existing.bookingStatus !== seedThread.bookingStatus ||
        Boolean(existing.unlinked) !== Boolean(seedThread.unlinked) ||
        existing.bookingMeta !== seedThread.bookingMeta;
      if (needsUpsert) {
        workingStore = upsertThreadIntoStore(store, seedThread);
        setStore(workingStore);
        saveMessagingStore(workingStore);
      }
    }

    const byBooking = findThreadIdByBookingRef(workingStore, bookingRef);
    const bySetup = findThreadIdByBusinessSetupId(workingStore, businessSetupId);
    const byName = findThreadIdByClientName(workingStore, searchPrefill);
    // Prefer the booking shop's current name when it uniquely identifies a thread.
    const resolvedThreadId =
      threadRef ||
      byBooking ||
      (byName && bySetup && byName === bySetup ? byName : "") ||
      bySetup ||
      byName ||
      workingStore.threads.find(
        (thread) =>
          thread.name.toLowerCase() ===
          (searchParams.get("client") ?? "").toLowerCase(),
      )?.id ||
      "";

    const openedFromBooking = Boolean(threadRef || bookingRef || seedThread);

    if (resolvedThreadId) {
      setActiveThreadId(resolvedThreadId);
      // Booking/thread deep-links select the conversation directly — do not
      // filter the sidebar by client name (that caused empty "no match" states).
      if (openedFromBooking) {
        setSearch("");
        return;
      }
      const thread = workingStore.threads.find((item) => item.id === resolvedThreadId);
      if (thread) {
        setSearch(thread.name);
        return;
      }
    }

    if (searchPrefill.trim()) {
      setSearch(searchPrefill.trim());
    }
  }, [
    navigation?.bookingRef,
    navigation?.businessSetupId,
    navigation?.searchPrefill,
    navigation?.seedThread,
    navigation?.threadId,
    searchParams,
    store,
  ]);

  const persist = React.useCallback((next: MessagingStore) => {
    const retained = applyMessageRetention(next);
    setStore(retained);
    saveMessagingStore(retained);
  }, []);

  React.useEffect(() => {
    if (!isAuthed) return;
    const onExternalUpdate = () => {
      setStore((prev) => {
        const runtime = loadMessagingRuntimeSnapshot();
        if (!runtime) return prev;
        if (!prev) return mergeApiInboxWithPrefs(runtime, loadMessagingPrefs(), audience);
        return mergeApiInboxIntoStore(prev, runtime, loadMessagingPrefs(), audience);
      });
    };
    window.addEventListener(MESSAGING_UPDATED_EVENT, onExternalUpdate);
    return () => window.removeEventListener(MESSAGING_UPDATED_EVENT, onExternalUpdate);
  }, [audience, isAuthed]);

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
  }, [audience, currentUserId, currentUserName, isAuthed, refetchInbox, threadIdsKey]);

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
  }, [isAuthed, store, threadIdsKey]);

  const bookingNavigationThreadIds = React.useMemo(
    () => collectBookingNavigationThreadIds(store ?? createEmptyMessagingStore(), navigation),
    [navigation?.bookingRef, navigation?.seedThread, navigation?.threadId, store],
  );

  const filteredThreads = React.useMemo(() => {
    if (!store) return [];
    return store.threads.filter((thread) => {
      if (bookingNavigationThreadIds.has(thread.id)) return true;
      if (isThreadHiddenForAudience(store, audience, thread.id)) return false;
      if (store.blockedThreadIds.includes(thread.id)) return false;
      if (!threadMatchesSearch(thread, search)) return false;
      if (!threadPassesDrawerFilters(thread, appliedDrawerFilters)) return false;
      if (audience === "professional") {
        // Never show client-side draft professionals or legacy demo seeds on the pro inbox.
        if (thread.id.startsWith("draft:") || thread.isNewConversation || isMockMessagingThreadId(thread.id)) {
          return false;
        }
        const hasClientMsg = (store.messagesByThreadId[thread.id] ?? []).some(isMessageFromClient);
        // Show only when the client initiated chat, or there is a real linked booking
        // (requested / confirmed / completed / in_progress).
        if (!hasClientMsg && !threadHasActiveBooking(store, thread.id)) return false;
      }
      return true;
    });
  }, [store, audience, search, appliedDrawerFilters, bookingNavigationThreadIds]);

  const visibleThreads = React.useMemo(() => {
    if (audience !== "client") return filteredThreads;
    return filteredThreads.slice(0, listVisibleCount);
  }, [audience, filteredThreads, listVisibleCount]);

  const hasMoreThreads = React.useMemo(() => {
    if (audience !== "client") return false;
    return listVisibleCount < filteredThreads.length || professionalsHasMore;
  }, [audience, filteredThreads.length, listVisibleCount, professionalsHasMore]);

  const loadMoreThreads = React.useCallback(async () => {
    if (!store || audience !== "client") return;
    if (listVisibleCount < filteredThreads.length) {
      setListVisibleCount((count) => count + CLIENT_PROFESSIONALS_PAGE_SIZE);
      return;
    }
    if (!professionalsHasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await loadProfessionalsPage(store, professionalsOffset, search);
      setStore(next);
      saveMessagingStore(next);
      setListVisibleCount((count) => count + CLIENT_PROFESSIONALS_PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [
    audience,
    filteredThreads.length,
    listVisibleCount,
    loadProfessionalsPage,
    loadingMore,
    professionalsHasMore,
    professionalsOffset,
    search,
    store,
  ]);

  React.useEffect(() => {
    const hasBookingNavigationTarget = bookingNavigationThreadIds.size > 0;
    if (!visibleThreads.length) {
      if (hasBookingNavigationTarget && activeThreadId) return;
      if (activeThreadId) setActiveThreadId("");
      return;
    }
    if (visibleThreads.some((thread) => thread.id === activeThreadId)) return;
    if (
      hasBookingNavigationTarget &&
      activeThreadId &&
      store?.threads.some((thread) => thread.id === activeThreadId)
    ) {
      return;
    }
    setActiveThreadId(visibleThreads[0].id);
  }, [activeThreadId, bookingNavigationThreadIds, store, visibleThreads]);

  React.useEffect(() => {
    if (!store || !activeThreadId) return;
    const messages = store.messagesByThreadId[activeThreadId] ?? [];
    const last = messages[messages.length - 1];
    if (!last) return;
    const currentRead = store.lastReadMessageIdByAudience?.[audience]?.[activeThreadId];
    if (currentRead === last.id) return;
    const next = markThreadReadForAudience(store, audience, activeThreadId);
    setStore(next);
    saveMessagingStore(next);
    if (isApiBackedStore(store) || isAuthed) {
      void markMessagingThreadRead({ threadId: activeThreadId, messageId: last.id });
    }
  }, [activeThreadId, audience, isAuthed, markMessagingThreadRead, store]);

  const activeThread = React.useMemo(() => {
    if (activeThreadId && store) {
      const direct = store.threads.find((thread) => thread.id === activeThreadId);
      if (direct) return direct;
    }
    if (!visibleThreads.length) return undefined;
    return (
      visibleThreads.find((t) => t.id === activeThreadId) ?? visibleThreads[0]
    );
  }, [activeThreadId, store, visibleThreads]);

  const messages = React.useMemo(() => {
    if (!store || !activeThread) return [];
    const messageKeys = new Set<string>([activeThread.id]);
    if (activeThread.professionalUserId) messageKeys.add(`draft:${activeThread.professionalUserId}`);
    if (activeThread.businessSetupId) messageKeys.add(`draft:setup-${activeThread.businessSetupId}`);
    if (activeThread.peerProfileId) messageKeys.add(`draft:setup-${activeThread.peerProfileId}`);

    const raw: MessagingChatMessage[] = [];
    const seen = new Set<string>();
    for (const key of messageKeys) {
      for (const message of store.messagesByThreadId[key] ?? []) {
        if (seen.has(message.id)) continue;
        seen.add(message.id);
        raw.push(message);
      }
    }
    raw.sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
    const peerReadAt = store.peerLastReadAtByThreadId?.[activeThread.id];
    return filterVisibleMessages(raw, audience).map((message) => {
      const normalized = normalizeMessageForAudience(message, audience, currentUserName, activeThread.name);
      return applyPeerReadReceiptToMessage(normalized, isMessageOwn(normalized, audience), peerReadAt);
    });
  }, [store, activeThread, audience, currentUserName]);

  const messageGroups = React.useMemo(() => groupMessagesByDate(messages), [messages]);

  const canReply =
    audience === "client" ? true : store && activeThread ? canProfessionalReply(store, activeThread.id) : false;

  const unreadCount = React.useMemo(() => {
    if (!store) return 0;
    return audience === "professional" ? getUnreadFromClientCount(store) : 0;
  }, [audience, store]);

  const sendMessage = React.useCallback(
    async (body: string, attachments?: MessagingAttachment[]) => {
      if (!store || !activeThread) return;
      if (audience === "professional" && !canProfessionalReply(store, activeThread.id)) {
        showSnackbar({
          severity: "info",
          message:
            "You can reply after the client sends the first message, or when there is a requested, confirmed, completed, or in-progress booking.",
        });
        return;
      }

      const trimmed = body.trim();
      if (!trimmed && !attachments?.length) return;

      const createdAt = new Date().toISOString();
      const clientMessageId = `msg-${Date.now()}`;
      const draftThreadId = activeThread.id;
      const selfName = "You";
      const msg: MessagingChatMessage = withMessageCreatedAt({
        id: clientMessageId,
        senderSide: "self",
        senderRole: audience === "client" ? "client" : "professional",
        senderName: selfName,
        senderAvatarSeed: currentUserName.trim() || selfName,
        timeLabel: formatMessageTimeLabel(),
        createdAt,
        body: trimmed,
        attachments,
        dateKey: todayDateKey(),
      });

      const applyOptimisticMessage = (base: MessagingStore, threadId: string, message: MessagingChatMessage) => {
        const threadMessages = [...(base.messagesByThreadId[threadId] ?? []), message];
        const nextThreads = base.threads.map((t) =>
          t.id === threadId ? applyLastMessageToThread(t, message, audience, currentUserName) : t,
        );
        return {
          ...base,
          threads: nextThreads,
          messagesByThreadId: { ...base.messagesByThreadId, [threadId]: threadMessages },
        };
      };

      if (isApiBackedStore(store) || isAuthed) {
        persist(applyOptimisticMessage(store, draftThreadId, msg));

        try {
          let uploadedAttachments = attachments;
          if (attachments?.length) {
            const token = accessToken || persistedToken;
            if (!token) throw new Error("Not authenticated");
            uploadedAttachments = await uploadMessagingAttachments(attachments, token);
          }

          const result = await sendMessagingMessage({
            threadId: draftThreadId,
            body: trimmed,
            attachments: uploadedAttachments,
            clientMessageId,
          }).unwrap();

          const resolvedThreadId = result.threadId;
          const saved = normalizeMessageForAudience(
            withMessageCreatedAt({
              ...result.message,
              attachments: resolveMessagingAttachments(result.message.attachments),
            }),
            audience,
            currentUserName,
            activeThread.name,
          );
          setStore((prev) => {
            if (!prev) return prev;
            let baseStore = prev;
            if (resolvedThreadId !== draftThreadId) {
              baseStore = replaceThreadIdInStore(prev, draftThreadId, resolvedThreadId);
            }

            const existing = baseStore.messagesByThreadId[resolvedThreadId] ?? [];
            const withoutOptimistic = existing.filter((item) => item.id !== clientMessageId);
            const threadMessages = [...withoutOptimistic, saved];
            const nextThreads = baseStore.threads.map((t) =>
              t.id === resolvedThreadId ? applyLastMessageToThread(t, saved, audience, currentUserName) : t,
            );
            const next = applyMessageRetention({
              ...baseStore,
              threads: nextThreads,
              messagesByThreadId: { ...baseStore.messagesByThreadId, [resolvedThreadId]: threadMessages },
            });
            saveMessagingStore(next);
            return next;
          });
          setActiveThreadId((prev) => (resolvedThreadId !== draftThreadId ? resolvedThreadId : prev));
        } catch (error) {
          setStore((prev) => {
            if (!prev) return prev;
            const threadMessages = (prev.messagesByThreadId[draftThreadId] ?? []).filter(
              (item) => item.id !== clientMessageId,
            );
            const next = applyMessageRetention({
              ...prev,
              messagesByThreadId: { ...prev.messagesByThreadId, [draftThreadId]: threadMessages },
            });
            saveMessagingStore(next);
            return next;
          });
          const message =
            error instanceof Error ? error.message : "Failed to send message. Please try again.";
          showSnackbar({ severity: "error", message });
        }
        return;
      }

      const threadMessages = [...(store.messagesByThreadId[activeThread.id] ?? []), msg];
      const nextThreads = store.threads.map((t) =>
        t.id === activeThread.id ? applyLastMessageToThread(t, msg, audience, currentUserName) : t,
      );

      const next = {
        ...store,
        threads: nextThreads,
        messagesByThreadId: { ...store.messagesByThreadId, [activeThread.id]: threadMessages },
      };
      persist(next);
      emitMessagingSend(activeThread.id, msg);
    },
    [store, activeThread, audience, currentUserName, isAuthed, accessToken, persistedToken, persist, sendMessagingMessage, showSnackbar],
  );

  const deleteMessage = React.useCallback(
    async (message: MessagingChatMessage, scope: "me" | "everyone") => {
      if (!store || !activeThread) return;

      if (isApiBackedStore(store) || isAuthed) {
        try {
          await deleteMessagingMessage({
            threadId: activeThread.id,
            messageId: message.id,
            scope,
          }).unwrap();
          const resolved = applyMessageDelete(store, audience, activeThread.id, message.id, scope);
          persist(resolved);
          showSnackbar({
            severity: "success",
            message: scope === "everyone" ? "Message deleted for everyone." : "Message deleted for you.",
          });
        } catch (error) {
          const msg =
            error && typeof error === "object" && "data" in error
              ? String((error as { data?: { message?: string } }).data?.message ?? "")
              : "";
          showSnackbar({ severity: "error", message: msg || "Failed to delete message." });
        }
        return;
      }

      persist(applyMessageDelete(store, audience, activeThread.id, message.id, scope));
      showSnackbar({
        severity: "success",
        message: scope === "everyone" ? "Message deleted for everyone." : "Message deleted for you.",
      });
    },
    [store, activeThread, audience, isAuthed, deleteMessagingMessage, persist, showSnackbar],
  );

  const deleteSelectedThreads = React.useCallback(() => {
    if (!store || selectedIds.size === 0) {
      showSnackbar({ severity: "warning", message: "Select at least one conversation to delete." });
      return;
    }
    const next = hideThreadsForAudience(store, audience, Array.from(selectedIds));
    persist(next);
    setSelectedIds(new Set());
    setSelectAll(false);
    showSnackbar({
      severity: "success",
      message:
        audience === "client"
          ? "Conversation removed from your history. The professional still has access until they delete it."
          : "Conversation removed from your history.",
    });
  }, [store, selectedIds, audience, persist, showSnackbar]);

  const blockThread = React.useCallback(
    (threadId: string) => {
      if (!store) return;
      persist({
        ...store,
        blockedThreadIds: Array.from(new Set([...store.blockedThreadIds, threadId])),
      });
      showSnackbar({ severity: "info", message: "Contact blocked." });
    },
    [store, persist, showSnackbar],
  );

  const clearChat = React.useCallback(
    async (scope: "me" | "everyone") => {
      if (!store || !activeThread) return;

      if (isApiBackedStore(store) || isAuthed) {
        try {
          const result = await clearMessagingThread({
            threadId: activeThread.id,
            scope,
          }).unwrap();
          let baseStore = store;
          if (result.threadId !== activeThread.id) {
            baseStore = replaceThreadIdInStore(store, activeThread.id, result.threadId);
            setActiveThreadId(result.threadId);
          }
          persist(applyClearChat(baseStore, audience, result.threadId, scope));
          showSnackbar({
            severity: "success",
            message:
              scope === "everyone"
                ? "Chat cleared for everyone."
                : "Chat cleared from your view. The professional remains in your list.",
          });
        } catch {
          showSnackbar({ severity: "error", message: "Failed to clear chat. Please try again." });
        }
        return;
      }

      persist(applyClearChat(store, audience, activeThread.id, scope));
      showSnackbar({
        severity: "success",
        message:
          scope === "everyone"
            ? "Chat cleared for everyone."
            : "Chat cleared from your view. The professional remains in your list.",
      });
    },
    [store, activeThread, audience, isAuthed, clearMessagingThread, persist, showSnackbar],
  );

  const deleteActiveThread = React.useCallback(
    (scope: "me" | "everyone") => {
      void clearChat(scope);
    },
    [clearChat],
  );

  const setPresenceStatus = React.useCallback(
    (status: MessagingPresenceStatus) => {
      if (!store) return;
      persist({ ...store, presenceStatus: status });
    },
    [store, persist],
  );

  const handleSettingsFiltersChange = React.useCallback(
    (next: MessagingSettingsFilters) => {
      setSettingsFilters(next);
      if (!store) return;
      persist(applyAutoDeleteSettings(store, next));
    },
    [store, persist],
  );

  const linkThreadToBooking = React.useCallback(
    async (booking: LinkableBooking) => {
      if (!store || !activeThread) return;
      const draftThreadId = activeThread.id;

      if (isApiBackedStore(store) || isAuthed) {
        try {
          const result = await linkMessagingThreadToBooking({
            threadId: draftThreadId,
            bookingId: booking.bookingId || booking.id,
          }).unwrap();

          setStore((prev) => {
            if (!prev) return prev;
            let baseStore = prev;
            if (result.threadId !== draftThreadId) {
              baseStore = replaceThreadIdInStore(prev, draftThreadId, result.threadId);
            }
            const nextThreads = baseStore.threads.map((t) =>
              t.id === result.threadId
                ? {
                    ...t,
                    ...result.thread,
                    id: result.threadId,
                    unlinked: false,
                  }
                : t,
            );
            const next = { ...baseStore, threads: nextThreads };
            saveMessagingStore(next);
            return next;
          });
          setActiveThreadId(result.threadId);
          showSnackbar({
            severity: "success",
            message: `Chat linked to ${formatLinkableBookingLabel(result.booking || booking)}.`,
          });
          return;
        } catch {
          showSnackbar({
            severity: "error",
            message: "Failed to link chat to booking. Please try again.",
          });
          return;
        }
      }

      const statusLabel = (booking.status || "confirmed")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const loc = activeThread.locationType === "desired" ? "DL" : "FL";
      const nextThreads = store.threads.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              bookingId: booking.bookingId,
              bookingMeta: `${booking.bookingId.replace(/^B/i, "")} - ${statusLabel} - ${loc}`,
              bookingStatus: (booking.status as MessagingThread["bookingStatus"]) || t.bookingStatus,
              unlinked: false,
            }
          : t,
      );
      persist({ ...store, threads: nextThreads });
      showSnackbar({
        severity: "success",
        message: `Chat linked to ${formatLinkableBookingLabel(booking)}.`,
      });
    },
    [
      store,
      activeThread,
      persist,
      showSnackbar,
      isAuthed,
      linkMessagingThreadToBooking,
    ],
  );

  const reportThread = React.useCallback(
    (payload: MessagingReportPayload) => {
      const detail = payload.otherText ? `: ${payload.otherText}` : "";
      showSnackbar({
        severity: "success",
        message: `Report submitted (${payload.reasonLabel}${detail}). Our team will review this conversation.`,
      });
    },
    [showSnackbar],
  );

  const toggleThreadSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (_: unknown, checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? new Set(visibleThreads.map((t) => t.id)) : new Set());
  };

  const applyDrawerFilters = () => {
    setAppliedDrawerFilters({ ...drawerFilters });
    showSnackbar({ severity: "success", message: "Filters applied." });
  };

  const resetDrawerFilters = () => {
    const defaults = defaultDrawerFilters();
    setDrawerFilters(defaults);
    setAppliedDrawerFilters(defaults);
  };

  return {
    store,
    search,
    setSearch,
    visibleThreads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    selectedIds,
    selectAll,
    toggleThreadSelection,
    handleSelectAll,
    deleteSelectedThreads,
    messageGroups,
    peerReadAt: activeThread ? store?.peerLastReadAtByThreadId?.[activeThread.id] : undefined,
    sendMessage,
    canReply,
    unreadCount,
    settingsFilters,
    setSettingsFilters: handleSettingsFiltersChange,
    presenceStatus: store?.presenceStatus ?? "online",
    setPresenceStatus,
    drawerFilters,
    setDrawerFilters,
    applyDrawerFilters,
    resetDrawerFilters,
    blockThread,
    clearChat,
    deleteActiveThread,
    deleteMessage,
    linkThreadToBooking,
    reportThread,
    loadMoreThreads,
    hasMoreThreads,
    loadingMore,
  };
}
