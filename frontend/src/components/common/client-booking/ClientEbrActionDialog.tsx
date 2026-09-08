"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";
import { useSnackbar } from "../AppSnackbar";

export type ClientEbrActionKind = "accept" | "suggest" | "reject";
export type ClientRequestActionContext = "ebr" | "br" | "er";

type Props = {
  open: boolean;
  action: ClientEbrActionKind | null;
  /** Same dialog shell; BR / EBR / ER copy only. */
  context?: ClientRequestActionContext;
  onClose: () => void;
  onConfirm: () => void;
};

const EBR_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; snackbarMessage?: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept EBR",
    body: "Confirm to accept these changes. They will be applied to your booking.",
    confirmLabel: "Accept",
    snackbarMessage: "Changes accepted. Your booking is confirmed.",
  },
  suggest: {
    title: "Suggest change EBR",
    body: "By choosing “Suggest changes”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest changes",
  },
  reject: {
    title: "Decline edited request",
    body: "These edited changes will not be applied. Your booking stays confirmed.",
    confirmLabel: "Decline",
    snackbarMessage: "Edit request rejected. Booking stays confirmed.",
    showWarning: true,
  },
};

const BR_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; snackbarMessage?: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept request",
    body: "Confirm to accept this booking request. Your booking will be confirmed.",
    confirmLabel: "Accept",
    snackbarMessage: "Booking request accepted.",
  },
  suggest: {
    title: "Suggest changes",
    body: "By choosing “Suggest changes”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest changes",
  },
  reject: {
    title: "Reject request",
    body: "Confirm to reject this booking request. The booking will be marked Invalid.",
    confirmLabel: "Reject",
    snackbarMessage: "Booking request rejected.",
    showWarning: true,
  },
};

const ER_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; snackbarMessage?: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept edit request",
    body: "Confirm to accept this edit request. The professional can update the booking once.",
    confirmLabel: "Accept",
    snackbarMessage: "Edit request accepted.",
  },
  suggest: {
    title: "Suggest changes",
    body: "By choosing “Suggest changes”, you can communicate through the messaging tool.",
    confirmLabel: "Suggest changes",
  },
  reject: {
    title: "Reject edit request",
    body: "Confirm to reject this edit request. Your booking stays confirmed.",
    confirmLabel: "Reject",
    snackbarMessage: "Edit request rejected. Booking stays confirmed.",
    showWarning: true,
  },
};

export default function ClientEbrActionDialog({
  open,
  action,
  context = "ebr",
  onClose,
  onConfirm,
}: Props) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  if (!action) return null;

  const copy = (
    context === "br" ? BR_COPY : context === "er" ? ER_COPY : EBR_COPY
  )[action];

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
            tone={action === "reject" ? "danger" : "primary"}
            label={copy.confirmLabel}
            onClick={() => {
              onConfirm();
              if (copy.snackbarMessage) {
                showSnackbar({
                  severity: "success",
                  message: copy.snackbarMessage,
                });
              }
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
