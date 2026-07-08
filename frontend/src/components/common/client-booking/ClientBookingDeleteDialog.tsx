"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../messaging/MessagingModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant?: "cancelled" | "completed";
};

export default function ClientBookingDeleteDialog({ open, onClose, onConfirm, variant = "cancelled" }: Props) {
  const m = useTheme().palette.mollure;
  const message =
    variant === "completed"
      ? "Remove this completed booking from your list?"
      : "Remove this cancelled booking from your list?";

  return (
    <MessagingModalShell
      open={open}
      title="Delete booking"
      onClose={onClose}
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
      <Box sx={{ py: 2, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.85) }}>{message}</Typography>
      </Box>
    </MessagingModalShell>
  );
}
