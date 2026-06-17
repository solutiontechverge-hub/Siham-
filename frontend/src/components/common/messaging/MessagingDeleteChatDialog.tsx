"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "./MessagingModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  embedded?: boolean;
};

export default function MessagingDeleteChatDialog({ open, onClose, onConfirm, embedded = false }: Props) {
  const m = useTheme().palette.mollure;

  return (
    <MessagingModalShell
      open={open}
      title="Delete chat"
      onClose={onClose}
      embedded={embedded}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Delete"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 2.5, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15, color: alpha(m.navy, 0.85) }}>
          Do you want to delete this chat?
        </Typography>
      </Box>
    </MessagingModalShell>
  );
}
