"use client";

import * as React from "react";
import { Box, Paper, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingBlockDialog from "./MessagingBlockDialog";
import MessagingChatActionsMenu, {
  type MessagingChatAction,
} from "./MessagingChatActionsMenu";
import MessagingChatPanel from "./MessagingChatPanel";
import MessagingConversationSidebar from "./MessagingConversationSidebar";
import MessagingDeleteChatDialog, {
  type MessagingDeleteScope,
} from "./MessagingDeleteChatDialog";
import MessagingDeleteMessageDialog, {
  type MessagingMessageDeleteScope,
} from "./MessagingDeleteMessageDialog";
import MessagingFiltersDrawer from "./MessagingFiltersDrawer";
import MessagingLinkBookingDialog from "./MessagingLinkBookingDialog";
import { getReportModalTitle } from "./messagingPeerLabels";
import MessagingReportDialog from "./MessagingReportDialog";
import MessagingSettingsDialog from "./MessagingSettingsDialog";
import { useSnackbar } from "../AppSnackbar";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage } from "./messagingTypes";
import { isMessageFromClient } from "./messagingUnread";
import type { MessagingInboxNavigation } from "./useMessagingInbox";
import { useMessagingInbox } from "./useMessagingInbox";

type DeleteDialogMode = "single" | "bulk" | "clear";

export type MessagingPageViewProps = {
  audience: MessagingAudience;
  currentUserName: string;
  currentUserAvatarSrc?: string;
  embedded?: boolean;
  navigation?: MessagingInboxNavigation;
  onClose?: () => void;
};

export default function MessagingPageView({
  audience,
  currentUserName,
  currentUserAvatarSrc,
  embedded = false,
  navigation,
  onClose,
}: MessagingPageViewProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isCompactEmbedded =
    embedded && useMediaQuery(theme.breakpoints.down("md"));
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

  React.useEffect(() => {
    if (!isCompactEmbedded) setMobileChatOpen(false);
  }, [isCompactEmbedded]);

  React.useEffect(() => {
    if (!isCompactEmbedded) return;
    if (
      (navigation?.bookingRef || navigation?.threadId) &&
      inbox.activeThread
    ) {
      setMobileChatOpen(true);
    }
  }, [
    inbox.activeThread,
    isCompactEmbedded,
    navigation?.bookingRef,
    navigation?.threadId,
  ]);

  const handleSelectThread = React.useCallback(
    (threadId: string) => {
      inbox.setActiveThreadId(threadId);
      if (isCompactEmbedded) setMobileChatOpen(true);
    },
    [inbox, isCompactEmbedded],
  );

  const handleMobileBack = React.useCallback(() => {
    setMobileChatOpen(false);
  }, []);

  const showSidebar = !isCompactEmbedded || !mobileChatOpen;
  const showChatPanel = !isCompactEmbedded || mobileChatOpen;

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
        setLinkBookingOpen(true);
        break;
      case "report":
        setReportOpen(true);
        break;
    }
  };

  if (!inbox.store) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "relative",
        pb: embedded ? 0 : 10,
        height: embedded ? "100%" : undefined,
        display: embedded ? "flex" : "block",
        flexDirection: "column",
        minHeight: 0,
        isolation: embedded ? "isolate" : undefined,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          borderRadius: embedded ? 0 : "12px",
          border: embedded ? "none" : `1px solid ${alpha(m.navy, 0.1)}`,
          bgcolor: "#fff",
          overflow: "hidden",
          minHeight: embedded ? 0 : { xs: 560, md: "calc(100vh - 220px)" },
          height: embedded ? "100%" : undefined,
          flex: embedded ? 1 : undefined,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {showSidebar ? (
          <MessagingConversationSidebar
            audience={audience}
            currentUserName={currentUserName}
            currentUserAvatarSrc={currentUserAvatarSrc}
            embedded={embedded}
            search={inbox.search}
            onSearchChange={inbox.setSearch}
            threads={inbox.visibleThreads}
            activeThreadId={inbox.activeThread?.id ?? ""}
            onSelectThread={handleSelectThread}
            selectedIds={inbox.selectedIds}
            selectAll={inbox.selectAll}
            onToggleSelect={inbox.toggleThreadSelection}
            onSelectAll={inbox.handleSelectAll}
            onRequestDelete={() => {
              if (inbox.selectedIds.size === 0) {
                showSnackbar({
                  severity: "warning",
                  message: "Select at least one conversation to delete.",
                });
                return;
              }
              setDeleteMode("bulk");
              setDeleteOpen(true);
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            onClose={embedded ? onClose : undefined}
            hasMore={inbox.hasMoreThreads}
            loadingMore={inbox.loadingMore}
            onLoadMore={() => void inbox.loadMoreThreads()}
            showBulkActions={audience !== "client"}
          />
        ) : null}

        {showChatPanel ? (
          <MessagingChatPanel
            audience={audience}
            currentUserName={currentUserName}
            thread={inbox.activeThread}
            messageGroups={inbox.messageGroups}
            onSend={inbox.sendMessage}
            onOpenActions={setActionsAnchor}
            onDeleteMessage={(message) => {
              setMessageToDelete(message);
              setDeleteMessageOpen(true);
            }}
            onClose={embedded ? onClose : undefined}
            onBack={
              isCompactEmbedded && mobileChatOpen ? handleMobileBack : undefined
            }
            composerDisabled={audience === "professional" && !inbox.canReply}
            composerDisabledHint={
              audience === "professional" && !inbox.canReply
                ? "Reply when the client messages first, or when a requested, confirmed, or completed booking exists."
                : undefined
            }
            peerReadAt={inbox.peerReadAt}
          />
        ) : null}
      </Paper>

      <MessagingSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        filters={inbox.settingsFilters}
        onChange={inbox.setSettingsFilters}
        presenceStatus={inbox.presenceStatus}
        onPresenceChange={inbox.setPresenceStatus}
        embedded={embedded}
      />

      <MessagingFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={inbox.drawerFilters}
        onChange={inbox.setDrawerFilters}
        audience={audience}
        embedded={embedded}
        onApply={() => {
          inbox.applyDrawerFilters();
          setFiltersOpen(false);
        }}
        onCancel={() => {
          inbox.resetDrawerFilters();
          setFiltersOpen(false);
        }}
      />

      <MessagingChatActionsMenu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={() => setActionsAnchor(null)}
        onAction={handleChatAction}
        embedded={embedded}
      />

      <MessagingLinkBookingDialog
        open={linkBookingOpen}
        onClose={() => setLinkBookingOpen(false)}
        onSubmit={inbox.linkThreadToBooking}
        embedded={embedded}
      />

      <MessagingReportDialog
        open={reportOpen}
        title={getReportModalTitle(audience)}
        onClose={() => setReportOpen(false)}
        onSubmit={inbox.reportThread}
        embedded={embedded}
      />

      <MessagingDeleteChatDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        embedded={embedded}
        mode={deleteMode}
        initialScope={deletePresetScope}
        onConfirm={(scope: MessagingDeleteScope) => {
          if (deleteMode === "bulk") inbox.deleteSelectedThreads();
          else inbox.clearChat(scope);
        }}
      />

      <MessagingDeleteMessageDialog
        open={deleteMessageOpen}
        onClose={() => {
          setDeleteMessageOpen(false);
          setMessageToDelete(null);
        }}
        embedded={embedded}
        canDeleteForEveryone={
          messageToDelete
            ? audience === "client"
              ? isMessageFromClient(messageToDelete)
              : !isMessageFromClient(messageToDelete)
            : false
        }
        onConfirm={(scope: MessagingMessageDeleteScope) => {
          if (messageToDelete) inbox.deleteMessage(messageToDelete, scope);
          setMessageToDelete(null);
        }}
      />

      <MessagingBlockDialog
        open={blockOpen}
        audience={audience}
        onClose={() => setBlockOpen(false)}
        embedded={embedded}
        onConfirm={() =>
          inbox.activeThread && inbox.blockThread(inbox.activeThread.id)
        }
      />
    </Box>
  );
}
