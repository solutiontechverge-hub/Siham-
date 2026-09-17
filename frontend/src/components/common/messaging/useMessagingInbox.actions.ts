"use client";

import * as React from "react";
import { getApiErrorMessage } from "../../../lib/api-error";
import { INPUT_LIMITS, parseText } from "../../../lib/inputSchema";
import type { LinkableBooking } from "./messagingBookingsMock";
import { formatLinkableBookingLabel } from "./messagingBookingsMock";
import { formatMessageTimeLabel, todayDateKey } from "./messagingMockData";
import { uploadMessagingAttachments, resolveMessagingAttachments } from "./messagingAttachmentUpload";
import { applyLastMessageToThread, normalizeMessageForAudience } from "./messagingPreview";
import { withMessageCreatedAt } from "./messagingRetention";
import type { MessagingReportPayload } from "./messagingReportReasons";
import {
  applyAutoDeleteSettings,
  applyClearChat,
  applyMessageDelete,
  applyMessageRetention,
  isApiBackedStore,
  hideThreadsForAudience,
  replaceThreadIdInStore,
  saveMessagingStore,
} from "./messagingStorage";
import { canProfessionalReply } from "./messagingThreadAccess";
import { emitMessagingSend } from "./messagingSocketClient";
import type { MessagingAudience } from "./messagingRoutes";
import type {
  MessagingAttachment,
  MessagingChatMessage,
  MessagingPresenceStatus,
  MessagingSettingsFilters,
  MessagingStore,
  MessagingThread,
} from "./messagingTypes";

export type MessagingInboxActionsDeps = {
  store: MessagingStore | null;
  activeThread: MessagingThread | undefined;
  audience: MessagingAudience;
  currentUserName: string;
  isAuthed: boolean;
  accessToken: string | null | undefined;
  persistedToken: string | null;
  selectedIds: Set<string>;
  persist: (next: MessagingStore) => void;
  setStore: React.Dispatch<React.SetStateAction<MessagingStore | null>>;
  setActiveThreadId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsFilters: React.Dispatch<React.SetStateAction<MessagingSettingsFilters>>;
  showSnackbar: (args: { severity: "success" | "error" | "info" | "warning"; message: string }) => void;
  sendMessagingMessage: (args: any) => { unwrap: () => Promise<any> };
  deleteMessagingMessage: (args: any) => { unwrap: () => Promise<any> };
  clearMessagingThread: (args: any) => { unwrap: () => Promise<any> };
  linkMessagingThreadToBooking: (args: any) => { unwrap: () => Promise<any> };
};

export function useMessagingInboxActions(deps: MessagingInboxActionsDeps) {
  const {
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
  } = deps;

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
      if (trimmed) {
        const bodyParsed = parseText(trimmed, {
          required: false,
          label: "Message",
          max: INPUT_LIMITS.textLong,
        });
        if (!bodyParsed.ok) {
          showSnackbar({ severity: "error", message: bodyParsed.error });
          return;
        }
      }

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
          const message = getApiErrorMessage(
            error,
            "Failed to send message. Please try again.",
          );
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


  return {
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
  };
}
