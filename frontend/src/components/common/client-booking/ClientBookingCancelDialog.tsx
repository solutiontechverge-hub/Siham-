"use client";

import { mollureBodyMutedSx, mollureLabelSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppTextField from "../AppTextField";
import MessagingDangerModal from "../messaging/MessagingDangerModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function ClientBookingCancelDialog({
  open,
  onClose,
  onConfirm,
}: Props) {
  const m = useTheme().palette.mollure;
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <MessagingDangerModal
      open={open}
      onClose={onClose}
      title="Cancel booking"
      maxWidth="sm"
      cancelLabel="Keep booking"
      primaryLabel="Cancel booking"
      primaryTone="danger"
      onPrimary={() => {
        onConfirm(reason.trim());
        onClose();
      }}
    >
      <Box sx={{ py: 1.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 13.5,
            color: alpha(m.navy, 0.78),
            lineHeight: 1.55,
          }}
        >
          Are you sure you want to cancel this booking?
        </Typography>
        <Typography
          sx={mollureBodyMutedSx(m.navy, { mt: 1.25, fontWeight: 700, lineHeight: 1.6 })}
        >
          This action cannot be undone. Any prepayment or deposit may be subject
          to the professional&apos;s cancellation policy, including
          late-cancellation fees. You will no longer be able to edit this
          booking.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography
            sx={mollureLabelSx(m.navy, { mb: 0.75, color: alpha(m.navy, 0.7) })}
          >
            Reason (optional)
          </Typography>
          <AppTextField
            fullWidth
            multiline
            minRows={2}
            placeholder="e.g. Team member fell sick"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Box>
      </Box>
    </MessagingDangerModal>
  );
}
