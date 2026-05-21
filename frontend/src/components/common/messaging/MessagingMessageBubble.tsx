"use client";

import { Box, Link, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingAvatar from "./MessagingAvatar";
import { isImageAttachment } from "./messagingFileUtils";
import { isMessageFromClient } from "./messagingUnread";
import type { MessagingChatMessage } from "./messagingTypes";

type Props = {
  message: MessagingChatMessage;
  isOwn: boolean;
  peerName: string;
};

export default function MessagingMessageBubble({ message, isOwn, peerName }: Props) {
  const m = useTheme().palette.mollure;
  const own = isOwn ?? isMessageFromClient(message);
  const displayName = own ? "You" : message.senderName || peerName;

  return (
    <Stack
      direction={own ? "row-reverse" : "row"}
      spacing={1.25}
      alignItems="flex-start"
      sx={{ alignSelf: own ? "flex-end" : "flex-start", maxWidth: "85%" }}
    >
      {!own ? <MessagingAvatar seed={message.senderAvatarSeed} size={34} /> : null}
      <Box sx={{ minWidth: 0, textAlign: own ? "right" : "left" }}>
        <Stack direction={own ? "row-reverse" : "row"} alignItems="baseline" spacing={0.75}>
          <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.85) }}>{displayName}</Typography>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.4) }}>{message.timeLabel}</Typography>
        </Stack>
        {message.body ? (
          <Typography
            sx={{
              mt: 0.45,
              fontSize: 12.5,
              lineHeight: 1.55,
              color: alpha(m.navy, 0.62),
              fontWeight: 500,
              textAlign: own ? "right" : "left",
            }}
          >
            {message.body}
          </Typography>
        ) : null}
        {message.attachments?.map((att) => {
          const canPreview = Boolean(att.url) && isImageAttachment(att.mimeType);
          return (
            <Box
              key={att.id}
              sx={{
                mt: 0.75,
                p: 1,
                borderRadius: "8px",
                bgcolor: own ? alpha(m.teal, 0.1) : alpha(m.navy, 0.04),
                border: `1px solid ${alpha(m.navy, 0.08)}`,
              }}
            >
              {canPreview ? (
                <Box
                  component="img"
                  src={att.url}
                  alt={att.name}
                  sx={{ maxWidth: 220, maxHeight: 160, borderRadius: "6px", display: "block" }}
                />
              ) : att.url ? (
                <Link href={att.url} target="_blank" rel="noopener noreferrer" download={att.name} sx={{ fontSize: 12, fontWeight: 700 }}>
                  {att.name}
                </Link>
              ) : (
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55) }}>{att.name}</Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
