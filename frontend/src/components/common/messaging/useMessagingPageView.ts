"use client";

import * as React from "react";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { MessagingChatAction } from "./MessagingChatActionsMenu";
import type { MessagingDeleteScope } from "./MessagingDeleteChatDialog";
import type { MessagingMessageDeleteScope } from "./MessagingDeleteMessageDialog";
import { useSnackbar } from "../AppSnackbar";
import { useGetMessagingLinkableBookingsQuery } from "../../../store/services/messagingApi";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage } from "./messagingTypes";
import { isMessageFromClient } from "./messagingUnread";
import type { MessagingInboxNavigation } from "./useMessagingInbox";
import { useMessagingInbox } from "./useMessagingInbox";
import { MESSAGING_PAGE_COPY } from "./messagingPage.data";

export type DeleteDialogMode = "single" | "bulk" | "clear";

export type UseMessagingPageViewArgs = {
  audience: MessagingAudience;
  currentUserName: string;
  navigation?: MessagingInboxNavigation;
};

export function useMessagingPageView({
  audience,
  currentUserName,
  navigation,
}: UseMessagingPageViewArgs) {
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down("md"));
  const { showSnackbar } = useSnackbar();
  const inbox = useMessagingInbox(audience, navigation, currentUserName);
  const [mobileChatOpen, setMobileChatOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(
    null,
  );
  const [linkBookingOpen, setLinkBookingOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteMode, setDeleteMode] =
    React.useState<DeleteDialogMode>("single");
  const [deletePresetScope, setDeletePresetScope] =
    React.useState<MessagingDeleteScope>("me");
  const [deleteMessageOpen, setDeleteMessageOpen] = React.useState(false);
  const [messageToDelete, setMessageToDelete] =
    React.useState<MessagingChatMessage | null>(null);

  const activeThreadId = inbox.activeThread?.id ?? "";
  const {
    data: linkableBookingsData,
    isFetching: linkableBookingsLoading,
    isSuccess: linkableBookingsReady,
  } = useGetMessagingLinkableBookingsQuery(activeThreadId, {
    skip: !activeThreadId,
  });
  const linkableBookings = linkableBookingsData?.bookings ?? [];
  // Hide only after we know there are no peer bookings.
  const canLinkToBooking = !(
    linkableBookingsReady && linkableBookings.length === 0
  );

  React.useEffect(() => {
    if (!isCompactLayout) setMobileChatOpen(false);
  }, [isCompactLayout]);

  React.useEffect(() => {
    if (!isCompactLayout) return;
    if (
      (navigation?.bookingRef || navigation?.threadId || navigation?.seedThread) &&
      inbox.activeThread
    ) {
      setMobileChatOpen(true);
    }
  }, [
    inbox.activeThread,
    isCompactLayout,
    navigation?.bookingRef,
    navigation?.seedThread,
    navigation?.threadId,
  ]);

  const handleSelectThread = React.useCallback(
    (threadId: string) => {
      inbox.setActiveThreadId(threadId);
      if (isCompactLayout) setMobileChatOpen(true);
    },
    [inbox, isCompactLayout],
  );

  const handleMobileBack = React.useCallback(() => {
    setMobileChatOpen(false);
  }, []);

  const showSidebar = !isCompactLayout || !mobileChatOpen;
  // When the inbox is empty, always show the chat pane empty-state (even on compact),
  // otherwise the message disappears behind the list-only mobile layout.
  const inboxIsEmpty = inbox.visibleThreads.length === 0;
  const showChatPanel =
    !isCompactLayout || mobileChatOpen || inboxIsEmpty;

  const handleChatAction = (action: MessagingChatAction) => {
    if (!inbox.activeThread) return;
    switch (action) {
      case "clearChat":
        setDeleteMode("clear");
        setDeleteOpen(true);
        break;
      case "deleteForMe":
        setDeleteMode("single");
        setDeletePresetScope("me");
        setDeleteOpen(true);
        break;
      case "deleteForEveryone":
        setDeleteMode("single");
        setDeletePresetScope("everyone");
        setDeleteOpen(true);
        break;
      case "block":
        setBlockOpen(true);
        break;
      case "link":
        if (!canLinkToBooking) return;
        setLinkBookingOpen(true);
        break;
      case "report":
        setReportOpen(true);
        break;
    }
  };

  const handleRequestDelete = () => {
    if (inbox.selectedIds.size === 0) {
      showSnackbar({
        severity: "warning",
        message: MESSAGING_PAGE_COPY.selectConversationToDelete,
      });
      return;
    }
    setDeleteMode("bulk");
    setDeleteOpen(true);
  };

  const handleDeleteMessageRequest = (message: MessagingChatMessage) => {
    setMessageToDelete(message);
    setDeleteMessageOpen(true);
  };

  const handleCloseDeleteMessage = () => {
    setDeleteMessageOpen(false);
    setMessageToDelete(null);
  };

  const handleConfirmDeleteMessage = (scope: MessagingMessageDeleteScope) => {
    if (messageToDelete) inbox.deleteMessage(messageToDelete, scope);
    setMessageToDelete(null);
  };

  const handleConfirmDeleteChat = (scope: MessagingDeleteScope) => {
    if (deleteMode === "bulk") inbox.deleteSelectedThreads();
    else inbox.clearChat(scope);
  };

  const handleConfirmBlock = () => {
    if (inbox.activeThread) inbox.blockThread(inbox.activeThread.id);
  };

  const handleApplyFilters = () => {
    inbox.applyDrawerFilters();
    setFiltersOpen(false);
  };

  const handleCancelFilters = () => {
    inbox.resetDrawerFilters();
    setFiltersOpen(false);
  };

  const emptyStateMessage = !inbox.activeThread
    ? inbox.openedFromBooking
      ? MESSAGING_PAGE_COPY.openingBookingConversation
      : audience === "professional"
        ? inbox.search.trim()
          ? MESSAGING_PAGE_COPY.professionalSearchEmpty
          : MESSAGING_PAGE_COPY.professionalEmpty
        : inbox.search.trim()
          ? MESSAGING_PAGE_COPY.clientSearchEmpty
          : MESSAGING_PAGE_COPY.clientEmpty
    : MESSAGING_PAGE_COPY.selectConversation;

  const composerDisabled = audience === "professional" && !inbox.canReply;
  const composerDisabledHint = composerDisabled
    ? MESSAGING_PAGE_COPY.composerDisabledHint
    : undefined;

  const chatBackHandler =
    isCompactLayout && mobileChatOpen ? handleMobileBack : undefined;

  const canDeleteMessageForEveryone = messageToDelete
    ? audience === "client"
      ? isMessageFromClient(messageToDelete)
      : !isMessageFromClient(messageToDelete)
    : false;

  return {
    inbox,
    isCompactLayout,
    mobileChatOpen,
    settingsOpen,
    setSettingsOpen,
    filtersOpen,
    setFiltersOpen,
    actionsAnchor,
    setActionsAnchor,
    linkBookingOpen,
    setLinkBookingOpen,
    reportOpen,
    setReportOpen,
    blockOpen,
    setBlockOpen,
    deleteOpen,
    setDeleteOpen,
    deleteMode,
    deletePresetScope,
    deleteMessageOpen,
    linkableBookings,
    linkableBookingsLoading,
    canLinkToBooking,
    showSidebar,
    showChatPanel,
    handleSelectThread,
    handleChatAction,
    handleRequestDelete,
    handleDeleteMessageRequest,
    handleCloseDeleteMessage,
    handleConfirmDeleteMessage,
    handleConfirmDeleteChat,
    handleConfirmBlock,
    handleApplyFilters,
    handleCancelFilters,
    emptyStateMessage,
    composerDisabled,
    composerDisabledHint,
    chatBackHandler,
    canDeleteMessageForEveryone,
  };
}
