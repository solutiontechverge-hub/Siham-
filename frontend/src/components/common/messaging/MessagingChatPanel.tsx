"use client";

import * as React from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
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
};

export default function MessagingChatPanel({ audience, thread, messageGroups, onSend, onOpenActions }: Props) {
  const m = useTheme().palette.mollure;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messageGroups, thread?.id]);

  if (!thread) {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 3 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: alpha(m.navy, 0.45) }}>
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, bgcolor: "#fff" }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <MessagingAvatar seed={thread.avatarSeed} size={44} />
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.6} flexWrap="wrap">
                <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.9) }}>{thread.name}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.45) }}>{thread.bookingMeta}</Typography>
                <CheckCircleRoundedIcon sx={{ fontSize: 14, color: "#4CAF50" }} />
              </Stack>
              {thread.online ? (
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#4CAF50", mt: 0.2 }}>Online</Typography>
              ) : null}
            </Box>
          </Stack>
          <IconButton size="small" aria-label="More options" onClick={(e) => onOpenActions(e.currentTarget)}>
            <MoreHorizRoundedIcon sx={{ color: alpha(m.navy, 0.45) }} />
          </IconButton>
        </Stack>
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
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
                    <MessagingMessageBubble message={msg} isOwn={own} peerName={thread.name} />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>

      <MessagingComposer onSend={onSend} />
    </Box>
  );
}
