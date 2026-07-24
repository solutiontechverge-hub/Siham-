"use client";

import * as React from "react";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingAvatar from "./MessagingAvatar";
import MessagingReadReceipt from "./MessagingReadReceipt";
import { isMessageReadByPeer } from "./messagingReadReceiptHelpers";
import {
  isImageAttachment,
  resolveMessagingAttachmentUrl,
} from "./messagingFileUtils";
import { resolveMessageSenderDisplayName } from "./messagingPreview";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingChatMessage } from "./messagingTypes";

type Props = {
  message: MessagingChatMessage;
  isOwn: boolean;
  audience: MessagingAudience;
  currentUserName: string;
  peerName: string;
  peerReadAt?: string | null;
  onRequestDelete?: (message: MessagingChatMessage) => void;
};

export default function MessagingMessageBubble({
  message,
  isOwn,
  audience,
  currentUserName,
  peerName,
  peerReadAt,
  onRequestDelete,
}: Props) {
  const m = useTheme().palette.mollure;
  const own = isOwn;
  const displayName = resolveMessageSenderDisplayName(message, {
    audience,
    currentUserName,
    peerName,
  });
  const readByPeer = own ? isMessageReadByPeer(message, peerReadAt) : false;
  const isDeleted = message.deletedForEveryone;
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  return (
    <Stack
      direction={own ? "row-reverse" : "row"}
      spacing={1.25}
      alignItems="flex-start"
      sx={{ alignSelf: own ? "flex-end" : "flex-start", maxWidth: "85%" }}
    >
      {!own ? (
        <MessagingAvatar
          seed={message.senderAvatarSeed}
          label={displayName}
          size={34}
        />
      ) : null}
      <Box sx={{ minWidth: 0, textAlign: own ? "right" : "left" }}>
        <Stack
          direction={own ? "row-reverse" : "row"}
          alignItems="center"
          spacing={0.5}
        >
          <Stack
            direction={own ? "row-reverse" : "row"}
            alignItems="baseline"
            spacing={0.75}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 12.5,
                color: own ? alpha(m.navy, 0.55) : m.teal,
                ...(own
                  ? {}
                  : {
                      display: "inline-block",
                      px: 0.75,
                      py: 0.2,
                      borderRadius: "6px",
                      bgcolor: alpha(m.teal, 0.12),
                    }),
              }}
            >
              {displayName}
            </Typography>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.4),
              }}
            >
              {message.timeLabel}
            </Typography>
            {own && !isDeleted ? (
              <MessagingReadReceipt readByPeer={readByPeer} />
            ) : null}
          </Stack>
          {!isDeleted && onRequestDelete ? (
            <IconButton
              size="small"
              aria-label="Message options"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ p: 0.25, color: alpha(m.navy, 0.35) }}
            >
              <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : null}
        </Stack>
        {isDeleted ? (
          <Typography
            sx={{
              mt: 0.45,
              fontSize: 12,
              fontStyle: "italic",
              color: alpha(m.navy, 0.42),
              fontWeight: 600,
              textAlign: own ? "right" : "left",
            }}
          >
            Message deleted
          </Typography>
        ) : message.body ? (
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
        {!isDeleted &&
          message.attachments?.map((att) => {
            const attachmentUrl = resolveMessagingAttachmentUrl(att.url);
            const canPreview =
              Boolean(attachmentUrl) && isImageAttachment(att.mimeType);
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
                  <>
                    <Box
                      component="img"
                      src={attachmentUrl}
                      alt={att.name}
                      sx={{
                        maxWidth: 220,
                        maxHeight: 160,
                        borderRadius: "6px",
                        display: "block",
                      }}
                    />
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: alpha(m.navy, 0.55),
                      }}
                    >
                      {att.name}
                    </Typography>
                  </>
                ) : attachmentUrl ? (
                  <Typography
                    component="a"
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ fontSize: 12, fontWeight: 700 }}
                  >
                    {att.name}
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    {att.name}
                  </Typography>
                )}
              </Box>
            );
          })}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: own ? "left" : "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: own ? "left" : "right",
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onRequestDelete?.(message);
          }}
          sx={{ fontSize: 13, fontWeight: 700 }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Stack>
  );
}
