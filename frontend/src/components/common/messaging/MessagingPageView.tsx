"use client";

import * as React from "react";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import { Badge, Box, Fab, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingBlockDialog from "./MessagingBlockDialog";
import MessagingChatActionsMenu, { type MessagingChatAction } from "./MessagingChatActionsMenu";
import MessagingChatPanel from "./MessagingChatPanel";
import MessagingConversationSidebar from "./MessagingConversationSidebar";
import MessagingDeleteChatDialog from "./MessagingDeleteChatDialog";
import MessagingFiltersDrawer from "./MessagingFiltersDrawer";
import MessagingLinkBookingDialog from "./MessagingLinkBookingDialog";
import { getReportModalTitle } from "./messagingPeerLabels";
import MessagingReportDialog from "./MessagingReportDialog";
import MessagingSettingsDialog from "./MessagingSettingsDialog";
import { useSnackbar } from "../AppSnackbar";
import type { MessagingAudience } from "./messagingRoutes";
import { useMessagingInbox } from "./useMessagingInbox";

type DeleteDialogMode = "single" | "bulk";

export type MessagingPageViewProps = {
  audience: MessagingAudience;
  currentUserName: string;
  currentUserAvatarSrc?: string;
};

export default function MessagingPageView({ audience, currentUserName, currentUserAvatarSrc }: MessagingPageViewProps) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const inbox = useMessagingInbox(audience);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(null);
  const [linkBookingOpen, setLinkBookingOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteMode, setDeleteMode] = React.useState<DeleteDialogMode>("single");

  const handleChatAction = (action: MessagingChatAction) => {
    if (!inbox.activeThread) return;
    switch (action) {
      case "delete":
        setDeleteMode("single");
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
    <Box sx={{ position: "relative", pb: 10 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          bgcolor: "#fff",
          overflow: "hidden",
          minHeight: { xs: 560, md: "calc(100vh - 220px)" },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <MessagingConversationSidebar
          audience={audience}
          currentUserName={currentUserName}
          currentUserAvatarSrc={currentUserAvatarSrc}
          search={inbox.search}
          onSearchChange={inbox.setSearch}
          threads={inbox.visibleThreads}
          activeThreadId={inbox.activeThread?.id ?? ""}
          onSelectThread={inbox.setActiveThreadId}
          selectedIds={inbox.selectedIds}
          selectAll={inbox.selectAll}
          onToggleSelect={inbox.toggleThreadSelection}
          onSelectAll={inbox.handleSelectAll}
          onRequestDelete={() => {
            if (inbox.selectedIds.size === 0) {
              showSnackbar({ severity: "warning", message: "Select at least one conversation to delete." });
              return;
            }
            setDeleteMode("bulk");
            setDeleteOpen(true);
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <MessagingChatPanel
          audience={audience}
          thread={inbox.activeThread}
          messageGroups={inbox.messageGroups}
          onSend={inbox.sendMessage}
          onOpenActions={setActionsAnchor}
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="Messaging"
        sx={{
          position: "fixed",
          right: { xs: 20, md: 32 },
          bottom: { xs: 20, md: 28 },
          width: 58,
          height: 58,
          bgcolor: m.teal,
          boxShadow: `0 10px 28px ${alpha(m.teal, 0.45)}`,
          "&:hover": { bgcolor: m.tealDark },
        }}
      >
        <Badge badgeContent={2} color="error" sx={{ "& .MuiBadge-badge": { fontWeight: 900, fontSize: 10 } }}>
          <ChatBubbleRoundedIcon sx={{ fontSize: 28, color: "#fff" }} />
        </Badge>
      </Fab>

      <MessagingSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        filters={inbox.settingsFilters}
        onChange={inbox.setSettingsFilters}
      />

      <MessagingFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={inbox.drawerFilters}
        onChange={inbox.setDrawerFilters}
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
      />

      <MessagingLinkBookingDialog
        open={linkBookingOpen}
        onClose={() => setLinkBookingOpen(false)}
        onSubmit={inbox.linkThreadToBooking}
      />

      <MessagingReportDialog
        open={reportOpen}
        title={getReportModalTitle(audience)}
        onClose={() => setReportOpen(false)}
        onSubmit={inbox.reportThread}
      />

      <MessagingDeleteChatDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (deleteMode === "bulk") inbox.deleteSelectedThreads();
          else inbox.deleteActiveThread();
        }}
      />

      <MessagingBlockDialog
        open={blockOpen}
        audience={audience}
        onClose={() => setBlockOpen(false)}
        onConfirm={() => inbox.activeThread && inbox.blockThread(inbox.activeThread.id)}
      />
    </Box>
  );
}
