"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../messaging/MessagingModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ClientBookingCancelDialog({ open, onClose, onConfirm }: Props) {
  const m = useTheme().palette.mollure;

  return (
    <MessagingModalShell
      open={open}
      title="Cancel booking"
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} label="Keep booking" />
          <MessagingModalPrimaryButton
            label="Cancel booking"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.78), lineHeight: 1.55 }}>
          Are you sure you want to cancel this booking?
        </Typography>
        <Typography sx={{ mt: 1.25, fontWeight: 700, fontSize: 12.5, color: alpha(m.navy, 0.55), lineHeight: 1.6 }}>
          This action cannot be undone. Any prepayment or deposit may be subject to the professional&apos;s cancellation
          policy, including late-cancellation fees. You will no longer be able to edit this booking.
        </Typography>
      </Box>
    </MessagingModalShell>
  );
}
