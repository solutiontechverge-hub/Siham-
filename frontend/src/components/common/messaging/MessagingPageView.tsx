"use client";

import { Box, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingBlockDialog from "./MessagingBlockDialog";
import MessagingChatActionsMenu from "./MessagingChatActionsMenu";
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
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingInboxNavigation } from "./useMessagingInbox";
import { useMessagingPageView } from "./useMessagingPageView";

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
  const {
    inbox,
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
  } = useMessagingPageView({ audience, currentUserName, navigation });

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
            onRequestDelete={handleRequestDelete}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            onClose={embedded ? onClose : undefined}
            hasMore={inbox.hasMoreThreads}
            loadingMore={inbox.loadingMore}
            onLoadMore={() => void inbox.loadMoreThreads()}
            showBulkActions={audience !== "client"}
            actionsEnabled={inbox.visibleThreads.length > 0}
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
            onDeleteMessage={handleDeleteMessageRequest}
            onClose={embedded ? onClose : undefined}
            onBack={chatBackHandler}
            composerDisabled={composerDisabled}
            composerDisabledHint={composerDisabledHint}
            peerReadAt={inbox.peerReadAt}
            emptyStateMessage={emptyStateMessage}
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
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
      />

      <MessagingChatActionsMenu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={() => setActionsAnchor(null)}
        onAction={handleChatAction}
        embedded={embedded}
        canLinkToBooking={canLinkToBooking}
      />

      <MessagingLinkBookingDialog
        open={linkBookingOpen}
        onClose={() => setLinkBookingOpen(false)}
        bookings={linkableBookings}
        loading={linkableBookingsLoading}
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
          handleConfirmDeleteChat(scope);
        }}
      />

      <MessagingDeleteMessageDialog
        open={deleteMessageOpen}
        onClose={handleCloseDeleteMessage}
        embedded={embedded}
        canDeleteForEveryone={canDeleteMessageForEveryone}
        onConfirm={(scope: MessagingMessageDeleteScope) => {
          handleConfirmDeleteMessage(scope);
        }}
      />

      <MessagingBlockDialog
        open={blockOpen}
        audience={audience}
        onClose={() => setBlockOpen(false)}
        embedded={embedded}
        onConfirm={handleConfirmBlock}
      />
    </Box>
  );
}
