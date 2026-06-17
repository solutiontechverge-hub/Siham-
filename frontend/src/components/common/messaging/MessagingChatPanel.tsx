"use client";

import * as React from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingAvatar from "./MessagingAvatar";
import MessagingMessageBubble from "./MessagingMessageBubble";
import MessagingComposer from "./MessagingComposer";
import { isMessageFromClient } from "./messagingUnread";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage, MessagingThread, MessagingAttachment } from "./messagingTypes";

type MessageGroup = {
  dateLabel: string;
  dateKey: string;
  messages: MessagingChatMessage[];
};

type Props = {
  audience: MessagingAudience;
  thread?: MessagingThread;
  messageGroups: MessageGroup[];
  onSend: (body: string, attachments?: MessagingAttachment[]) => void;
  onOpenActions: (anchor: HTMLElement) => void;
  onDeleteMessage?: (message: MessagingChatMessage) => void;
  composerDisabled?: boolean;
  composerDisabledHint?: string;
  onClose?: () => void;
  onBack?: () => void;
};

export default function MessagingChatPanel({
  audience,
  thread,
  messageGroups,
  onSend,
  onOpenActions,
  onDeleteMessage,
  composerDisabled = false,
  composerDisabledHint,
  onClose,
  onBack,
}: Props) {
  const m = useTheme().palette.mollure;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messageGroups, thread?.id]);

  if (!thread) {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Typography sx={{ fontSize: { xs: 13, sm: 14 }, fontWeight: 700, color: alpha(m.navy, 0.45), textAlign: "center" }}>
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, bgcolor: "#fff" }}>
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 2.5 }, py: { xs: 1.25, sm: 1.75 }, borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.25 }} sx={{ minWidth: 0, flex: 1 }}>
            {onBack ? (
              <IconButton size="small" aria-label="Back to conversations" onClick={onBack} sx={{ flexShrink: 0, ml: -0.5 }}>
                <ArrowBackRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.55) }} />
              </IconButton>
            ) : null}
            <MessagingAvatar seed={thread.avatarSeed} size={40} />
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.6} flexWrap="wrap">
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 13, sm: 14 }, color: alpha(m.navy, 0.9) }} noWrap>
                  {thread.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    fontWeight: 700,
                    color: alpha(m.navy, 0.45),
                    display: { xs: "none", sm: "block" },
                  }}
                  noWrap
                >
                  {thread.bookingMeta}
                </Typography>
                <CheckCircleRoundedIcon sx={{ fontSize: 14, color: "#4CAF50", flexShrink: 0 }} />
              </Stack>
              {thread.online || thread.presenceStatus === "online" ? (
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#4CAF50", mt: 0.2 }}>Online</Typography>
              ) : thread.presenceStatus === "busy" ? (
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#FF9800", mt: 0.2 }}>Busy</Typography>
              ) : thread.presenceStatus === "offline" ? (
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#F44336", mt: 0.2 }}>Offline</Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.45),
                    mt: 0.2,
                    display: { xs: "block", sm: "none" },
                  }}
                  noWrap
                >
                  {thread.bookingMeta}
                </Typography>
              )}
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
            <IconButton size="small" aria-label="More options" onClick={(e) => onOpenActions(e.currentTarget)}>
              <MoreHorizRoundedIcon sx={{ color: alpha(m.navy, 0.45) }} />
            </IconButton>
            {onClose ? (
              <IconButton size="small" aria-label="Close messaging" onClick={onClose} sx={{ display: { xs: "none", md: "inline-flex" } }}>
                <CloseRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }} />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", px: { xs: 1.5, sm: 2, md: 2.5 }, py: { xs: 1.5, sm: 2 }, minHeight: 0 }}>
        {messageGroups.map((group) => (
          <Box key={group.dateKey} sx={{ mb: 2.5 }}>
            <Typography align="center" sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.42), mb: 2 }}>
              {group.dateLabel}
            </Typography>
            <Stack spacing={2} sx={{ width: "100%" }}>
              {group.messages.map((msg) => {
                const own =
                  audience === "client" ? isMessageFromClient(msg) : !isMessageFromClient(msg);
                return (
                  <Box key={msg.id} sx={{ width: "100%", display: "flex", justifyContent: own ? "flex-end" : "flex-start" }}>
                    <MessagingMessageBubble
                      message={msg}
                      isOwn={own}
                      peerName={thread.name}
                      onRequestDelete={onDeleteMessage}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>

      <MessagingComposer onSend={onSend} disabled={composerDisabled} disabledHint={composerDisabledHint} />
    </Box>
  );
}
