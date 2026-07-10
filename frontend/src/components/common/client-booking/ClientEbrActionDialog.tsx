"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingModalShell, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../messaging/MessagingModalShell";

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
    body: "By accepting, the EBR will be confirmed",
    confirmLabel: "Accept",
  },
  suggest: {
    title: "Suggest change EBR",
    body: "By choosing “Suggest Change”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest Change",
  },
  reject: {
    title: "Reject EBR",
    body: "By rejecting, the EBR will be invalid",
    confirmLabel: "Reject",
    showWarning: true,
  },
};

export default function ClientEbrActionDialog({ open, action, onClose, onConfirm }: Props) {
  const m = useTheme().palette.mollure;
  if (!action) return null;

  const copy = COPY[action];

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
        {copy.showWarning ? (
          <WarningAmberRoundedIcon sx={{ fontSize: 52, color: "#E85D5D", mb: 1.5 }} />
        ) : null}
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88), lineHeight: 1.55, px: 1 }}>
          {copy.body}
        </Typography>
      </Box>
    </MessagingModalShell>
  );
}
