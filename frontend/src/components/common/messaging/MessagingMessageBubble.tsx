"use client";

import * as React from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import {
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureLabelSx,
} from "../../../theme/mollureHierarchy";
import MessagingAvatar from "./MessagingAvatar";
import MessagingReadReceipt from "./MessagingReadReceipt";
import { isMessageReadByPeer } from "./messagingReadReceiptHelpers";
import {
  downloadMessagingAttachment,
  isImageAttachment,
  resolveMessagingAttachmentUrl,
} from "./messagingFileUtils";
import { resolveMessageSenderDisplayName } from "./messagingPreview";
import type { MessagingAudience } from "./messagingRoutes";
import type { MessagingAttachment, MessagingChatMessage } from "./messagingTypes";

type Props = {
  message: MessagingChatMessage;
  isOwn: boolean;
  audience: MessagingAudience;
  currentUserName: string;
  peerName: string;
  peerReadAt?: string | null;
  onRequestDelete?: (message: MessagingChatMessage) => void;
};

function AttachmentCard({
  attachment,
  own,
}: {
  attachment: MessagingAttachment;
  own: boolean;
}) {
  const m = useTheme().palette.mollure;
  const attachmentUrl = resolveMessagingAttachmentUrl(attachment.url);
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const canPreview =
    Boolean(attachmentUrl) && isImageAttachment(attachment.mimeType) && !previewFailed;
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    if (!attachmentUrl || downloading) return;
    setError(null);
    setDownloading(true);
    try {
      await downloadMessagingAttachment({
        url: attachmentUrl,
        fileName: attachment.name || "attachment",
      });
    } catch {
      // Fallback: open in new tab if fetch/download fails (e.g. CORS).
      try {
        const link = document.createElement("a");
        link.href = attachmentUrl;
        link.download = attachment.name || "attachment";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch {
        setError("Download failed.");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 0.75,
        p: 1,
        borderRadius: "8px",
        bgcolor: own ? alpha(m.teal, 0.1) : alpha(m.navy, 0.04),
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        maxWidth: 260,
      }}
    >
      {canPreview ? (
        <Box
          component="img"
          src={attachmentUrl}
          alt={attachment.name}
          onError={() => setPreviewFailed(true)}
          sx={{
            maxWidth: "100%",
            maxHeight: 160,
            borderRadius: "6px",
            display: "block",
            mb: 0.75,
          }}
        />
      ) : null}

      <Stack direction="row" alignItems="center" spacing={0.75}>
        {!canPreview ? (
          <InsertDriveFileRoundedIcon
            sx={{ fontSize: 18, color: m.teal, flexShrink: 0 }}
          />
        ) : null}
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.78),
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={attachment.name}
        >
          {attachment.name}
        </Typography>
        <IconButton
          size="small"
          aria-label={`Download ${attachment.name}`}
          disabled={!attachmentUrl || downloading}
          onClick={() => void handleDownload()}
          sx={{
            p: 0.45,
            color: m.teal,
            bgcolor: alpha(m.teal, 0.1),
            "&:hover": { bgcolor: alpha(m.teal, 0.18) },
            "&.Mui-disabled": { opacity: 0.5 },
          }}
        >
          {downloading ? (
            <CircularProgress size={14} sx={{ color: m.teal }} />
          ) : (
            <DownloadRoundedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Stack>
      {error ? (
        <Typography
          sx={{ mt: 0.5, fontSize: 11, fontWeight: 600, color: "#D32F2F" }}
        >
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}

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
              sx={mollureLabelSx(m.navy, {
                fontWeight: 900,
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
              })}
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
            sx={mollureBodyMutedSx(m.navy, {
              mt: 0.45,
              lineHeight: 1.55,
              color: alpha(m.navy, 0.62),
              fontWeight: 500,
              textAlign: own ? "right" : "left",
            })}
          >
            {message.body}
          </Typography>
        ) : null}
        {!isDeleted &&
          message.attachments?.map((att) => (
            <AttachmentCard key={att.id} attachment={att} own={own} />
          ))}
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
