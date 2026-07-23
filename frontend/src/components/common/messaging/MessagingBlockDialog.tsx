"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { MessagingAudience } from "./messagingRoutes";
import { getBlockModalCopy } from "./messagingPeerLabels";
import AppModal, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../AppModal";

type Props = {
  open: boolean;
  audience: MessagingAudience;
  onClose: () => void;
  onConfirm: () => void;
  embedded?: boolean;
};

export default function MessagingBlockDialog({ open, audience, onClose, onConfirm, embedded = false }: Props) {
  const m = useTheme().palette.mollure;
  const copy = getBlockModalCopy(audience);

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={copy.title}
      onClose={onClose}
      embedded={embedded}
      headerTone="danger"
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
    </AppModal>
  );
}
