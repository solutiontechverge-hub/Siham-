"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

export type ClientEbrActionKind = "accept" | "suggest" | "reject";
export type ClientRequestActionContext = "ebr" | "br";

type Props = {
  open: boolean;
  action: ClientEbrActionKind | null;
  /** Same dialog shell; BR vs EBR copy only. */
  context?: ClientRequestActionContext;
  onClose: () => void;
  onConfirm: () => void;
};

const EBR_COPY: Record<
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

const BR_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept request",
    body: "Confirm to accept this booking request. Your booking will be confirmed.",
    confirmLabel: "Accept",
  },
  suggest: {
    title: "Suggest changes",
    body: "By choosing “Suggest Change”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest Change",
  },
  reject: {
    title: "Reject request",
    body: "Confirm to reject this booking request. The booking will be cancelled with no charges.",
    confirmLabel: "Reject",
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
  if (!action) return null;

  const copy = (context === "br" ? BR_COPY : EBR_COPY)[action];

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
