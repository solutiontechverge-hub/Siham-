"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../messaging/MessagingModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ClientBookingDiscardDialog({ open, onClose, onConfirm }: Props) {
  const m = useTheme().palette.mollure;

  return (
    <MessagingModalShell
      open={open}
      title="Discard booking request"
      onClose={onClose}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Discard"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 2, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.85) }}>
          Are you sure you want to discard your BR? It will be deleted afterward.
        </Typography>
      </Box>
    </MessagingModalShell>
  );
}
