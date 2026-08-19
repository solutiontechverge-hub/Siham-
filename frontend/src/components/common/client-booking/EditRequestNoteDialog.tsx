"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppTextField from "../AppTextField";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
};

/** Required notepad before sending a Confirmed booking Edit Request (ER). */
export default function EditRequestNoteDialog({
  open,
  onClose,
  onConfirm,
  title = "Request to edit",
  description = "Write a short note explaining why you want to edit this booking. The other party will receive this request.",
  placeholder = "I want to edit this booking because…",
  confirmLabel = "Send request",
  initialValue = "",
}: Props) {
  const m = useTheme().palette.mollure;
  const [note, setNote] = React.useState(initialValue);

  React.useEffect(() => {
    if (open) setNote(initialValue);
  }, [open, initialValue]);

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={title}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label={confirmLabel}
            disabled={!note.trim()}
            onClick={() => {
              onConfirm(note.trim());
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ pt: 0.5, pb: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 13,
            color: alpha(m.navy, 0.72),
            mb: 1.5,
            lineHeight: 1.45,
          }}
        >
          {description}
        </Typography>
        <AppTextField
          fullWidth
          multiline
          minRows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
        />
      </Box>
    </AppModal>
  );
}
