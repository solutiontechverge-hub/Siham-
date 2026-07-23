"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../AppModal";

export type ClientEbrActionKind = "accept" | "suggest" | "reject";

type Props = {
  open: boolean;
  action: ClientEbrActionKind | null;
  onClose: () => void;
  onConfirm: () => void;
};

const COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept EBR",
    body: "Confirm to accept these changes. They will be applied to your booking.",
    confirmLabel: "Accept",
  },
  suggest: {
    title: "Suggest change EBR",
    body: "By choosing “Suggest Change”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest Change",
  },
  reject: {
    title: "Reject EBR",
    body: "Confirm to reject these changes. They will not be applied to your booking.",
    confirmLabel: "Reject",
    showWarning: true,
  },
};

export default function ClientEbrActionDialog({ open, action, onClose, onConfirm }: Props) {
  const m = useTheme().palette.mollure;
  if (!action) return null;

  const copy = COPY[action];

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={copy.title}
      onClose={onClose}
      headerTone={action === "reject" ? "danger" : "default"}
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
        {copy.showWarning ? (
          <WarningAmberRoundedIcon sx={{ fontSize: 52, color: "#E85D5D", mb: 1.5 }} />
        ) : null}
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88), lineHeight: 1.55, px: 1 }}>
          {copy.body}
        </Typography>
      </Box>
    </AppModal>
  );
}
