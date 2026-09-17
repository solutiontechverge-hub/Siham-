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
import { applyPeerReadReceiptToMessage } from "./messagingReadReceiptHelpers";
import { getMessageTimestamp } from "./messagingRetention";
import {
  getUnreadFromClientCount,
  isMessageFromClient,
  markThreadReadForAudience,
} from "./messagingUnread";
import {
  canProfessionalReply,
  collectBookingNavigationThreadIds,
  threadHasActiveBooking,
} from "./messagingThreadAccess";
import {
  applyMessageRetention,
  filterVisibleMessages,
  isApiBackedStore,
  isThreadHiddenForAudience,
  saveMessagingStore,
  threadMatchesSearch,
} from "./messagingStorage";
import { CLIENT_PROFESSIONALS_PAGE_SIZE } from "./messagingProfessionals";
import { createEmptyMessagingStore, isMockMessagingThreadId } from "./messagingMockData";
import { threadPassesDrawerFilters } from "./messagingFilters";
import type { MessagingAudience } from "./messagingRoutes";
import type {
  MessagingChatMessage,
  MessagingDrawerFilters,
  MessagingSettingsFilters,
  MessagingStore,
} from "./messagingTypes";
import { defaultDrawerFilters, defaultSettingsFilters } from "./messagingTypes";
import { isMessageOwn, normalizeMessageForAudience } from "./messagingPreview";

import { groupMessagesByDate } from "./useMessagingInbox.helpers";
import { useMessagingInboxActions } from "./useMessagingInbox.actions";
import {
  useMessagingInboxHydration,
  useMessagingInboxProfessionals,
  type MessagingInboxNavigation,
} from "./useMessagingInbox.hydrate";
import { useMessagingInboxRealtime } from "./useMessagingInbox.realtime";

export type { MessagingInboxNavigation };

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

  const { loadProfessionalsPage, buildFromSetups } = useMessagingInboxProfessionals({
    audience,
    search,
    fetchProfessionals,
    businessSetups,
    setProfessionalsHasMore,
    setProfessionalsOffset,
    setListVisibleCount,
    professionalsLoadedRef,
  });

  const seedThread = navigation?.seedThread;
  const openedFromBooking = Boolean(
    navigation?.threadId ||
      navigation?.bookingRef ||
      seedThread ||
      searchParams.get("booking") ||
      searchParams.get("thread"),
  );

  useMessagingInboxHydration({
    audience,
    isAuthed,
    apiInbox,
    apiInboxLoaded,
    navigation,
    seedThread,
    searchParams,
    businessSetups,
    loadProfessionalsPage,
    buildFromSetups,
    setStore,
    setActiveThreadId,
    setSearch,
    setProfessionalsHasMore,
    professionalsLoadedRef,
    inboxHydratingRef,
    inboxHydratedRef,
    store,
  });

  const persist = React.useCallback((next: MessagingStore) => {
    const retained = applyMessageRetention(next);
    setStore(retained);
    saveMessagingStore(retained);
  }, []);

  useMessagingInboxRealtime({
    audience,
    isAuthed,
    currentUserId,
    currentUserName,
    activeThreadId,
    store,
    seedThread,
    refetchInbox,
    setStore,
  });

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
        // Show only when the client initiated chat, or there is a real linked booking.
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
    const hasBookingNavigationTarget = bookingNavigationThreadIds.size > 0 || openedFromBooking;
    if (!visibleThreads.length) {
      if (hasBookingNavigationTarget && activeThreadId) return;
      if (hasBookingNavigationTarget) return;
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
  }, [
    activeThreadId,
    bookingNavigationThreadIds,
    openedFromBooking,
    store,
    visibleThreads,
  ]);

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

  const {
    sendMessage,
    deleteMessage,
    deleteSelectedThreads,
    blockThread,
    clearChat,
    deleteActiveThread,
    setPresenceStatus,
    handleSettingsFiltersChange,
    linkThreadToBooking,
    reportThread,
  } = useMessagingInboxActions({
    store,
    activeThread,
    audience,
    currentUserName,
    isAuthed,
    accessToken,
    persistedToken,
    selectedIds,
    persist,
    setStore,
    setActiveThreadId,
    setSelectedIds,
    setSelectAll,
    setSettingsFilters,
    showSnackbar,
    sendMessagingMessage,
    deleteMessagingMessage,
    clearMessagingThread,
    linkMessagingThreadToBooking,
  });

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
    openedFromBooking,
  };
}
