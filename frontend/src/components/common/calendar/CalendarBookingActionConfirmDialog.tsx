"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

export type CalendarBookingAction = "cancel" | "in_progress";

type Props = {
  open: boolean;
  action: CalendarBookingAction | null;
  onClose: () => void;
  onConfirm: () => void;
};

const COPY: Record<
  CalendarBookingAction,
  { title: string; body: string; confirmLabel: string; showWarning?: boolean }
> = {
  cancel: {
    title: "Cancel booking",
    body: "Are you sure you want to cancel this booking? This action cannot be undone.",
    confirmLabel: "Cancel booking",
    showWarning: true,
  },
  in_progress: {
    title: "Mark in progress",
    body: "Are you sure you want to mark this booking as in progress?",
    confirmLabel: "Mark in progress",
  },
};

export default function CalendarBookingActionConfirmDialog({
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
      headerTone={action === "cancel" ? "danger" : "default"}
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
