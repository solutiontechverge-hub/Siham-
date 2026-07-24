"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

export type BookingRequestConfirmAction = "accept" | "reject";

type Props = {
  open: boolean;
  action: BookingRequestConfirmAction | null;
  onClose: () => void;
  onConfirm: () => void;
};

const COPY: Record<
  BookingRequestConfirmAction,
  { title: string; body: string; confirmLabel: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept request",
    body: "By accepting, the requested changes will be applied to this booking.",
    confirmLabel: "Accept",
  },
  reject: {
    title: "Reject request",
    body: "By rejecting, the requested changes will not be applied. The booking stays as it is.",
    confirmLabel: "Reject",
    showWarning: true,
  },
};

export default function BookingRequestConfirmDialog({
  open,
  action,
  onClose,
  onConfirm,
}: Props) {
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
      maxWidth="sm"
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
          <WarningAmberRoundedIcon
            sx={{ fontSize: 52, color: "#E85D5D", mb: 1.5 }}
          />
        ) : null}
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 14,
            color: alpha(m.navy, 0.88),
            lineHeight: 1.55,
            px: 1,
          }}
        >
          {copy.body}
        </Typography>
      </Box>
    </AppModal>
  );
}
