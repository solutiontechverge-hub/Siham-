"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useSnackbar } from "../AppSnackbar";
import type { LinkableBooking } from "./messagingBookingsMock";
import { formatLinkableBookingLabel } from "./messagingBookingsMock";
import { formatMessageTimeLabel, todayDateKey } from "./messagingMockData";
import type { MessagingReportPayload } from "./messagingReportReasons";
import {
  getUnreadFromClientCount,
  isMessageFromClient,
  markThreadReadForAudience,
} from "./messagingUnread";
import {
  emitMessagingSend,
  fetchMessagingHistory,
  joinMessagingThreads,
  onMessagingMessage,
} from "./messagingSocketClient";
import { canProfessionalReply, findThreadIdByBookingRef } from "./messagingThreadAccess";
import { threadMatchesSearch, hideThreadsForAudience, isThreadHiddenForAudience, loadMessagingStore, saveMessagingStore } from "./messagingStorage";
import { threadPassesDrawerFilters, threadPassesSettingsFilters } from "./messagingFilters";
import type { MessagingAudience } from "./messagingRoutes";
import type {
  MessagingAttachment,
  MessagingChatMessage,
  MessagingDrawerFilters,
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
    if (!merged.some((item) => item.id === message.id)) merged.push(message);
  }
  merged.sort((a, b) => a.id.localeCompare(b.id));
  return {
    ...store,
    messagesByThreadId: { ...store.messagesByThreadId, [threadId]: merged },
  };
}

export type MessagingInboxNavigation = {
  bookingRef?: string;
  threadId?: string;
};

export function useMessagingInbox(audience: MessagingAudience, navigation?: MessagingInboxNavigation) {
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [store, setStore] = React.useState<MessagingStore | null>(null);
  const [search, setSearch] = React.useState("");
  const [activeThreadId, setActiveThreadId] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);
  const [settingsFilters, setSettingsFilters] = React.useState<MessagingSettingsFilters>(defaultSettingsFilters);
  const [drawerFilters, setDrawerFilters] = React.useState<MessagingDrawerFilters>(defaultDrawerFilters);
  const [appliedDrawerFilters, setAppliedDrawerFilters] = React.useState<MessagingDrawerFilters>(defaultDrawerFilters);

  React.useEffect(() => {
    const loaded = loadMessagingStore();
    setStore(loaded);
    if (loaded.threads[0]) setActiveThreadId(loaded.threads[0].id);
  }, []);

  React.useEffect(() => {
    if (!store) return;
    const bookingRef = navigation?.bookingRef ?? searchParams.get("booking") ?? "";
    const threadRef = navigation?.threadId ?? searchParams.get("thread") ?? "";
    const resolvedThreadId =
      threadRef ||
      findThreadIdByBookingRef(store, bookingRef) ||
      store.threads.find((thread) => thread.name.toLowerCase() === (searchParams.get("client") ?? "").toLowerCase())?.id ||
      "";
    if (resolvedThreadId) setActiveThreadId(resolvedThreadId);
  }, [navigation?.bookingRef, navigation?.threadId, searchParams, store]);

  const persist = React.useCallback((next: MessagingStore) => {
    setStore(next);
    saveMessagingStore(next);
  }, []);

  React.useEffect(() => {
    if (!store) return;
    const threadIds = store.threads.map((thread) => thread.id);
    joinMessagingThreads(threadIds);

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

    return onMessagingMessage(({ threadId, message }) => {
      setStore((prev) => {
        if (!prev) return prev;
        const local = prev.messagesByThreadId[threadId] ?? [];
        if (local.some((item) => item.id === message.id)) return prev;
        const threadMessages = [...local, message];
        const preview = message.body || (message.attachments?.[0]?.name ?? "Attachment");
        const nextThreads = prev.threads.map((thread) =>
          thread.id === threadId ? { ...thread, preview, timeLabel: message.timeLabel } : thread,
        );
        const next = {
          ...prev,
          threads: nextThreads,
          messagesByThreadId: { ...prev.messagesByThreadId, [threadId]: threadMessages },
        };
        saveMessagingStore(next);
        return next;
      });
    });
  }, [store?.threads.length]);

  const visibleThreads = React.useMemo(() => {
    if (!store) return [];
    return store.threads.filter((thread) => {
      if (isThreadHiddenForAudience(store, audience, thread.id)) return false;
      if (store.blockedThreadIds.includes(thread.id)) return false;
      if (!threadMatchesSearch(thread, search)) return false;
      if (!threadPassesSettingsFilters(thread, settingsFilters)) return false;
      if (!threadPassesDrawerFilters(thread, appliedDrawerFilters)) return false;
      if (audience === "professional" && !(store.messagesByThreadId[thread.id] ?? []).some(isMessageFromClient)) {
        return false;
      }
      return true;
    });
  }, [store, audience, search, settingsFilters, appliedDrawerFilters]);

  React.useEffect(() => {
    if (!visibleThreads.length) return;
    if (!visibleThreads.some((t) => t.id === activeThreadId)) {
      setActiveThreadId(visibleThreads[0].id);
    }
  }, [activeThreadId, visibleThreads]);

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
  }, [store, activeThreadId, audience]);

  const activeThread = visibleThreads.find((t) => t.id === activeThreadId) ?? visibleThreads[0];

  const messages = React.useMemo(() => {
    if (!store || !activeThread) return [];
    return store.messagesByThreadId[activeThread.id] ?? [];
  }, [store, activeThread]);

  const messageGroups = React.useMemo(() => groupMessagesByDate(messages), [messages]);

  const canReply =
    audience === "client" ? true : store && activeThread ? canProfessionalReply(store, activeThread.id) : false;

  const unreadCount = React.useMemo(() => {
    if (!store) return 0;
    return audience === "professional" ? getUnreadFromClientCount(store) : 0;
  }, [audience, store]);

  const sendMessage = React.useCallback(
    (body: string, attachments?: MessagingAttachment[]) => {
      if (!store || !activeThread) return;
      if (audience === "professional" && !canProfessionalReply(store, activeThread.id)) {
        showSnackbar({
          severity: "info",
          message: "You can reply after the client sends the first message.",
        });
        return;
      }

      const trimmed = body.trim();
      if (!trimmed && !attachments?.length) return;

      const msg: MessagingChatMessage = {
        id: `msg-${Date.now()}`,
        senderSide: "self",
        senderRole: audience === "client" ? "client" : "professional",
        senderName: "You",
        senderAvatarSeed: "you",
        timeLabel: formatMessageTimeLabel(),
        body: trimmed,
        attachments,
        dateKey: todayDateKey(),
      };

      const threadMessages = [...(store.messagesByThreadId[activeThread.id] ?? []), msg];
      const preview = trimmed || (attachments?.[0]?.name ?? "Attachment");
      const nextThreads = store.threads.map((t) =>
        t.id === activeThread.id ? { ...t, preview, timeLabel: msg.timeLabel } : t,
      );

      const next = {
        ...store,
        threads: nextThreads,
        messagesByThreadId: { ...store.messagesByThreadId, [activeThread.id]: threadMessages },
      };
      persist(next);
      emitMessagingSend(activeThread.id, msg);
    },
    [store, activeThread, audience, persist, showSnackbar],
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

  const deleteActiveThread = React.useCallback(() => {
    if (!store || !activeThread) return;
    persist(hideThreadsForAudience(store, audience, [activeThread.id]));
    showSnackbar({ severity: "success", message: "Chat deleted from your history." });
  }, [store, activeThread, audience, persist, showSnackbar]);

  const linkThreadToBooking = React.useCallback(
    (booking: LinkableBooking) => {
      if (!store || !activeThread) return;
      const statusPart = activeThread.bookingMeta.split("-").slice(1).join("-").trim() || "Confirmed - ER";
      const nextThreads = store.threads.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              bookingId: booking.bookingId,
              bookingMeta: `${booking.bookingId.replace(/^B/i, "")} - ${statusPart}`,
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
    [store, activeThread, persist, showSnackbar],
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
    sendMessage,
    canReply,
    unreadCount,
    settingsFilters,
    setSettingsFilters,
    drawerFilters,
    setDrawerFilters,
    applyDrawerFilters,
    resetDrawerFilters,
    blockThread,
    deleteActiveThread,
    linkThreadToBooking,
    reportThread,
  };
}
