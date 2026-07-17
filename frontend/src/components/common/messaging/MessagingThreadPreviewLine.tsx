"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { MessagingThread } from "./messagingTypes";

type Props = {
  thread: MessagingThread;
};

export default function MessagingThreadPreviewLine({ thread }: Props) {
  const m = useTheme().palette.mollure;
  const preview = thread.preview?.trim();

  if (!preview) {
    return (
      <Typography sx={{ mt: 0.5, fontSize: 11.5, lineHeight: 1.45, fontWeight: 500, color: alpha(m.navy, 0.42) }}>
        {thread.isNewConversation ? "Tap to start a conversation" : ""}
      </Typography>
    );
  }

  const senderName = thread.previewSenderName?.trim();
  const fromPeer = thread.previewFromPeer ?? false;

  if (!senderName) {
    return (
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 11.5,
          lineHeight: 1.45,
          fontWeight: 500,
          color: alpha(m.navy, 0.5),
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {preview}
      </Typography>
    );
  }

  return (
    <Typography
      component="div"
      sx={{
        mt: 0.5,
        fontSize: 11.5,
        lineHeight: 1.45,
        fontWeight: 500,
        color: alpha(m.navy, 0.5),
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      <Box
        component="span"
        sx={{
          fontWeight: fromPeer ? 900 : 700,
          color: fromPeer ? m.teal : alpha(m.navy, 0.62),
        }}
      >
        {senderName}:
      </Box>{" "}
      {preview}
    </Typography>
  );
}
