"use client";

import * as React from "react";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Box, Chip, IconButton, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { filesToMessagingAttachments, revokeAttachmentUrls } from "./messagingFileUtils";
import type { MessagingAttachment } from "./messagingTypes";

const FILE_INPUT_ID = "messaging-attach-input";

type Props = {
  onSend: (body: string, attachments?: MessagingAttachment[]) => void;
};

export default function MessagingComposer({ onSend }: Props) {
  const m = useTheme().palette.mollure;
  const [draft, setDraft] = React.useState("");
  const [pendingAttachments, setPendingAttachments] = React.useState<MessagingAttachment[]>([]);
  const [attachError, setAttachError] = React.useState<string | null>(null);

  const handleSend = () => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachError(null);
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length) return;

    const result = filesToMessagingAttachments(files);
    if (!result.ok) {
      setAttachError(result.error);
      return;
    }
    setPendingAttachments((prev) => [...prev, ...result.attachments]);
  };

  const removePending = (id: string) => {
    setPendingAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed) revokeAttachmentUrls([removed]);
      return prev.filter((a) => a.id !== id);
    });
  };

  return (
    <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${alpha(m.navy, 0.08)}` }}>
      <input
        id={FILE_INPUT_ID}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        onChange={handleFileChange}
      />

      {pendingAttachments.length > 0 ? (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.25 }}>
          {pendingAttachments.map((att) => (
            <Chip
              key={att.id}
              size="small"
              label={att.name}
              onDelete={() => removePending(att.id)}
              deleteIcon={<CloseRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ maxWidth: 220, fontWeight: 700, fontSize: 11 }}
            />
          ))}
        </Stack>
      ) : null}

      {attachError ? (
        <Typography sx={{ mb: 1, fontSize: 11.5, fontWeight: 600, color: "#D32F2F" }}>{attachError}</Typography>
      ) : null}

      <Stack direction="row" alignItems="flex-end" spacing={1}>
        <Box
          component="label"
          htmlFor={FILE_INPUT_ID}
          sx={{
            flexShrink: 0,
            mb: 0.5,
            display: "inline-flex",
            cursor: "pointer",
            borderRadius: "50%",
            bgcolor: alpha(m.navy, 0.04),
            "&:hover": { bgcolor: alpha(m.navy, 0.08) },
          }}
        >
          <IconButton component="span" tabIndex={-1} size="small" aria-label="Attach file" disableRipple sx={{ pointerEvents: "none" }}>
            <AttachFileRoundedIcon sx={{ fontSize: 22, color: alpha(m.navy, 0.45), transform: "rotate(45deg)" }} />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder="Type Message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontSize: 13,
              bgcolor: "#fff",
              "& fieldset": { borderColor: alpha(m.teal, 0.55), borderWidth: 1.5 },
              "&:hover fieldset": { borderColor: m.teal },
              "&.Mui-focused fieldset": { borderColor: m.teal },
            },
          }}
        />

        <IconButton
          type="button"
          size="small"
          aria-label="Send message"
          disabled={!draft.trim() && !pendingAttachments.length}
          onClick={handleSend}
          sx={{
            flexShrink: 0,
            mb: 0.5,
            bgcolor: m.teal,
            color: "#fff",
            width: 40,
            height: 40,
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
