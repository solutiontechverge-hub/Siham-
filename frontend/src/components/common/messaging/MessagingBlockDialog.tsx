"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { MessagingAudience } from "./messagingRoutes";
import { getBlockModalCopy } from "./messagingPeerLabels";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "./MessagingModalShell";

type Props = {
  open: boolean;
  audience: MessagingAudience;
  onClose: () => void;
  onConfirm: () => void;
};

export default function MessagingBlockDialog({ open, audience, onClose, onConfirm }: Props) {
  const m = useTheme().palette.mollure;
  const copy = getBlockModalCopy(audience);

  return (
    <MessagingModalShell
      open={open}
      title={copy.title}
      onClose={onClose}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label={copy.confirmLabel}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 2.5, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.85), lineHeight: 1.5 }}>
          {copy.message}
        </Typography>
      </Box>
    </MessagingModalShell>
  );
}
