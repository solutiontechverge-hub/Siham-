"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppTextField from "../AppTextField";
import AppModal, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../AppModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
};

/** Suggest-changes notepad — uses the shared AppModal shell. */
export default function ClientEbrSuggestNoteDialog({ open, onClose, onConfirm }: Props) {
  const m = useTheme().palette.mollure;
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title="Suggest changes"
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Ok"
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
        <Typography sx={{ fontWeight: 800, fontSize: 13, color: alpha(m.navy, 0.72), mb: 1.5, lineHeight: 1.45 }}>
          Write the changes you want to suggest to the professional.
        </Typography>
        <AppTextField
          fullWidth
          multiline
          minRows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe your suggested changes…"
        />
      </Box>
    </AppModal>
  );
}
