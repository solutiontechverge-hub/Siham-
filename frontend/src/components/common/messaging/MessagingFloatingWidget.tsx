"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import { Badge, Box, Fab, Modal, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import { useMessagingWidget } from "./MessagingWidgetContext";
import type { MessagingAudience } from "./messagingRoutes";
import { useClientMessagingUnread } from "./useClientMessagingUnread";
import { useProfessionalMessagingUnread } from "./useProfessionalMessagingUnread";
import { useMessagingCurrentUserProfile } from "./useMessagingCurrentUserProfile";
import {
  saveMessagingStore,
  loadMessagingRuntimeSnapshot,
  mergeApiInboxWithPrefs,
  loadMessagingPrefs,
  upsertThreadIntoStore,
} from "./messagingStorage";
import { markAllThreadsReadForAudience } from "./messagingUnread";

const MessagingPageView = dynamic(() => import("./MessagingPageView"), {
  ssr: false,
});

export type MessagingFloatingWidgetProps = {
  audience: MessagingAudience;
};

export default function MessagingFloatingWidget({
  audience,
}: MessagingFloatingWidgetProps) {
  const m = useTheme().palette.mollure;
  const pathname = usePathname();
  const { open, params, openMessaging, closeMessaging } = useMessagingWidget();
  const { userName, avatarUrl } = useMessagingCurrentUserProfile(audience);
  const clientUnread = useClientMessagingUnread();
  const professionalUnread = useProfessionalMessagingUnread();
  const unreadCount = audience === "client" ? clientUnread : professionalUnread;

  const messagingRoutePrefix =
    audience === "client" ? "/clients/messaging" : "/professionals/messaging";
  const hideFab = pathname?.startsWith(messagingRoutePrefix);

  React.useEffect(() => {
    if (!open) return;
    const runtime = loadMessagingRuntimeSnapshot();
    if (!runtime) return;
    let store = mergeApiInboxWithPrefs(runtime, loadMessagingPrefs(), audience);
    if (params.seedThread) {
      store = upsertThreadIntoStore(store, params.seedThread);
    }
    const next = markAllThreadsReadForAudience(store, audience);
    saveMessagingStore(next);
  }, [audience, open, params.seedThread]);

  return (
    <>
      <Modal
        open={open}
        onClose={() => closeMessaging()}
        disableAutoFocus
        disableRestoreFocus
        disableScrollLock
        slotProps={{
          backdrop: { sx: { bgcolor: "transparent" } },
        }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      >
        <Paper
          elevation={12}
          tabIndex={-1}
          sx={{
            position: "fixed",
            right: 0,
            bottom: 0,
            outline: "none",
            width: {
              xs: "100vw",
              sm: "85vw",
              md: "72vw",
              lg: "60vw",
            },
            maxWidth: { md: 960, lg: 1100 },
            height: {
              xs: "min(92dvh, 100%)",
              sm: "80vh",
              md: "75vh",
              lg: "70vh",
            },
            maxHeight: { xs: "100dvh", sm: "85vh", lg: "80vh" },
            borderRadius: { xs: "16px 16px 0 0", sm: "14px 0 0 0" },
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            borderRight: { sm: "none" },
            borderBottom: "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
            boxShadow: "0 -8px 40px rgba(16, 35, 63, 0.14)",
            pb: "env(safe-area-inset-bottom, 0px)",
            isolation: "isolate",
          }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MessagingPageView
              audience={audience}
              currentUserName={userName}
              currentUserAvatarSrc={avatarUrl}
              embedded
              navigation={{
                bookingRef: params.bookingRef,
                threadId: params.threadId,
                businessSetupId: params.businessSetupId,
                searchPrefill: params.searchPrefill,
                seedThread: params.seedThread,
              }}
              onClose={closeMessaging}
            />
          </Box>
        </Paper>
      </Modal>

      {!hideFab && !open ? (
        <Fab
          color="primary"
          aria-label="Open messaging"
          onClick={() => openMessaging()}
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 20, md: 32 },
            bottom: { xs: "max(16px, env(safe-area-inset-bottom))", md: 28 },
            width: { xs: 52, sm: 58 },
            height: { xs: 52, sm: 58 },
            bgcolor: m.teal,
            zIndex: 1200,
            boxShadow: `0 10px 28px ${alpha(m.teal, 0.45)}`,
            "&:hover": { bgcolor: m.tealDark },
          }}
        >
          <Badge
            badgeContent={unreadCount > 9 ? "9+" : unreadCount}
            color="error"
            invisible={unreadCount <= 0}
            sx={{
              "& .MuiBadge-badge": {
                fontWeight: 900,
                fontSize: { xs: 9, sm: 10 },
              },
            }}
          >
            <ChatBubbleRoundedIcon
              sx={{ fontSize: { xs: 24, sm: 28 }, color: "#fff" }}
            />
          </Badge>
        </Fab>
      ) : null}
    </>
  );
}
