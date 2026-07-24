"use client";

import * as React from "react";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  filesToMessagingAttachments,
  isImageAttachment,
  revokeAttachmentUrls,
} from "./messagingFileUtils";
import type { MessagingAttachment } from "./messagingTypes";

type AttachKind = "picture" | "document";

const PICTURE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif";
const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

type Props = {
  onSend: (body: string, attachments?: MessagingAttachment[]) => void;
  disabled?: boolean;
  disabledHint?: string;
};

export default function MessagingComposer({
  onSend,
  disabled = false,
  disabledHint,
}: Props) {
  const m = useTheme().palette.mollure;
  const instanceId = React.useId();
  const pictureInputRef = React.useRef<HTMLInputElement>(null);
  const documentInputRef = React.useRef<HTMLInputElement>(null);
  const [draft, setDraft] = React.useState("");
  const [pendingAttachments, setPendingAttachments] = React.useState<
    MessagingAttachment[]
  >([]);
  const [attachError, setAttachError] = React.useState<string | null>(null);
  const [attachMenuAnchor, setAttachMenuAnchor] =
    React.useState<HTMLElement | null>(null);

  const handleSend = () => {
    if (disabled) return;
    const trimmed = draft.trim();
    if (!trimmed && !pendingAttachments.length) return;

    const toSend = pendingAttachments.map((a) => ({ ...a }));
    onSend(trimmed, toSend.length ? toSend : undefined);
    revokeAttachmentUrls(pendingAttachments);
    setDraft("");
    setPendingAttachments([]);
    setAttachError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addFiles = (files: FileList | File[] | null | undefined) => {
    setAttachError(null);
    if (!files?.length) return;

    const result = filesToMessagingAttachments(files);
    if (!result.ok) {
      setAttachError(result.error);
      return;
    }
    setPendingAttachments((prev) => [...prev, ...result.attachments]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const openFilePicker = (kind: AttachKind) => {
    setAttachMenuAnchor(null);
    if (disabled) return;
    const input =
      kind === "picture" ? pictureInputRef.current : documentInputRef.current;
    input?.click();
  };

  const removePending = (id: string) => {
    setPendingAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed) revokeAttachmentUrls([removed]);
      return prev.filter((a) => a.id !== id);
    });
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 2.5 },
        py: { xs: 1.5, sm: 2 },
        borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
      }}
    >
      {disabled && disabledHint ? (
        <Typography
          sx={{
            mb: 1.25,
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.52),
            lineHeight: 1.45,
          }}
        >
          {disabledHint}
        </Typography>
      ) : null}

      <input
        ref={pictureInputRef}
        id={`${instanceId}-picture`}
        type="file"
        multiple
        accept={PICTURE_ACCEPT}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <input
        ref={documentInputRef}
        id={`${instanceId}-document`}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {pendingAttachments.length > 0 ? (
        <Stack spacing={0.75} sx={{ mb: 1.25 }}>
          {pendingAttachments.map((att) => {
            const isImage = isImageAttachment(att.mimeType);
            return (
              <Stack
                key={att.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 1.25,
                  py: 0.85,
                  borderRadius: "10px",
                  bgcolor: alpha(m.teal, 0.08),
                  border: `1px solid ${alpha(m.teal, 0.22)}`,
                }}
              >
                {isImage ? (
                  <ImageRoundedIcon
                    sx={{ fontSize: 18, color: m.teal, flexShrink: 0 }}
                  />
                ) : (
                  <InsertDriveFileRoundedIcon
                    sx={{ fontSize: 18, color: m.teal, flexShrink: 0 }}
                  />
                )}
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
                  title={att.name}
                >
                  {att.name}
                </Typography>
                <IconButton
                  size="small"
                  aria-label={`Remove ${att.name}`}
                  onClick={() => removePending(att.id)}
                  sx={{ p: 0.35, color: alpha(m.navy, 0.45) }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            );
          })}
        </Stack>
      ) : null}

      {attachError ? (
        <Typography
          sx={{ mb: 1, fontSize: 11.5, fontWeight: 600, color: "#D32F2F" }}
        >
          {attachError}
        </Typography>
      ) : null}

      <Stack direction="row" alignItems="flex-end" spacing={1}>
        <IconButton
          type="button"
          size="small"
          aria-label="Attach file"
          disabled={disabled}
          onClick={(e) => setAttachMenuAnchor(e.currentTarget)}
          sx={{
            flexShrink: 0,
            mb: 0.5,
            bgcolor: alpha(m.navy, 0.04),
            "&:hover": { bgcolor: alpha(m.navy, 0.08) },
            opacity: disabled ? 0.45 : 1,
          }}
        >
          <AttachFileRoundedIcon
            sx={{
              fontSize: 22,
              color: alpha(m.navy, 0.45),
              transform: "rotate(45deg)",
            }}
          />
        </IconButton>

        <Menu
          anchorEl={attachMenuAnchor}
          open={Boolean(attachMenuAnchor)}
          onClose={() => setAttachMenuAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{
            paper: { sx: { minWidth: 180, borderRadius: "12px", mt: -1 } },
          }}
        >
          <MenuItem onClick={() => openFilePicker("picture")} sx={{ py: 1.1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ImageRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
            </ListItemIcon>
            <ListItemText
              primary="Picture"
              primaryTypographyProps={{ fontSize: 13, fontWeight: 700 }}
            />
          </MenuItem>
          <MenuItem onClick={() => openFilePicker("document")} sx={{ py: 1.1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <InsertDriveFileRoundedIcon
                sx={{ fontSize: 20, color: m.teal }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Document"
              primaryTypographyProps={{ fontSize: 13, fontWeight: 700 }}
            />
          </MenuItem>
        </Menu>

        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={
            disabled ? "Waiting for client message..." : "Type Message"
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontSize: { xs: 12.5, sm: 13 },
              bgcolor: "#fff",
              "& fieldset": {
                borderColor: alpha(m.teal, 0.55),
                borderWidth: 1.5,
              },
              "&:hover fieldset": { borderColor: m.teal },
              "&.Mui-focused fieldset": { borderColor: m.teal },
            },
          }}
        />

        <IconButton
          type="button"
          size="small"
          aria-label="Send message"
          disabled={disabled || (!draft.trim() && !pendingAttachments.length)}
          onClick={handleSend}
          sx={{
            flexShrink: 0,
            mb: 0.5,
            bgcolor: m.teal,
            color: "#fff",
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            "&:hover": { bgcolor: m.tealDark },
            "&.Mui-disabled": { bgcolor: alpha(m.teal, 0.35), color: "#fff" },
          }}
        >
          <SendRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
