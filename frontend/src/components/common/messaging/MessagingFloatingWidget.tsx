"use client";

import * as React from "react";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import { Badge, Box, Fab, Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import { useAppSelector } from "../../../store/hooks";
import MessagingPageView from "./MessagingPageView";
import { useMessagingWidget } from "./MessagingWidgetContext";
import type { MessagingAudience } from "./messagingRoutes";
import { useClientMessagingUnread } from "./useClientMessagingUnread";
import { useProfessionalMessagingUnread } from "./useProfessionalMessagingUnread";
import { loadMessagingStore, saveMessagingStore } from "./messagingStorage";
import { markAllThreadsReadForAudience } from "./messagingUnread";

function useMessagingProfile(audience: MessagingAudience) {
  const user = useAppSelector((s) => s.auth.user);
  const fallbackDisplayName =
    ((user as { display_name?: string })?.display_name as string | undefined) ||
    `${(user as { first_name?: string })?.first_name ?? ""} ${(user as { last_name?: string })?.last_name ?? ""}`.trim();
  const [userName, setUserName] = React.useState(fallbackDisplayName || (audience === "client" ? "User" : "Professional"));
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (audience !== "client") return;
    try {
      const raw = window.localStorage.getItem("mollure:client_profile");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        avatar_url?: string | null;
        email?: string;
        first_name?: string;
        last_name?: string;
        display_name?: string;
      };
      const authedEmail = user?.email?.trim().toLowerCase();
      const persistedEmail = data?.email?.trim().toLowerCase();
      if (authedEmail && persistedEmail && authedEmail === persistedEmail) {
        if (typeof data.avatar_url === "string" && data.avatar_url) setAvatarUrl(data.avatar_url);
        const persistedName = (data.display_name ?? "").trim();
        const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        const resolved = persistedName || fullName;
        if (resolved) setUserName(resolved);
      }
    } catch {
      // ignore
    }
  }, [audience, user?.email]);

  React.useEffect(() => {
    const next = fallbackDisplayName.trim();
    if (next) setUserName(next);
  }, [fallbackDisplayName]);

  return { userName, avatarUrl };
}

export type MessagingFloatingWidgetProps = {
  audience: MessagingAudience;
};

export default function MessagingFloatingWidget({ audience }: MessagingFloatingWidgetProps) {
  const m = useTheme().palette.mollure;
  const pathname = usePathname();
  const { open, params, openMessaging, closeMessaging } = useMessagingWidget();
  const { userName, avatarUrl } = useMessagingProfile(audience);
  const clientUnread = useClientMessagingUnread();
  const professionalUnread = useProfessionalMessagingUnread();
  const unreadCount = audience === "client" ? clientUnread : professionalUnread;

  const messagingRoutePrefix = audience === "client" ? "/clients/messaging" : "/professionals/messaging";
  const hideFab = pathname?.startsWith(messagingRoutePrefix);

  React.useEffect(() => {
    if (!open) return;
    const store = loadMessagingStore();
    const next = markAllThreadsReadForAudience(store, audience);
    saveMessagingStore(next);
  }, [audience, open]);

  return (
    <>
      {open ? (
        <Paper
          elevation={12}
          sx={{
            position: "fixed",
            right: 0,
            bottom: 0,
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
            zIndex: 1300,
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
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <MessagingPageView
              audience={audience}
              currentUserName={userName}
              currentUserAvatarSrc={avatarUrl}
              embedded
              navigation={{
                bookingRef: params.bookingRef,
                threadId: params.threadId,
                searchPrefill: params.searchPrefill,
              }}
              onClose={closeMessaging}
            />
          </Box>
        </Paper>
      ) : null}

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
            sx={{ "& .MuiBadge-badge": { fontWeight: 900, fontSize: { xs: 9, sm: 10 } } }}
          >
            <ChatBubbleRoundedIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: "#fff" }} />
          </Badge>
        </Fab>
      ) : null}
    </>
  );
}
