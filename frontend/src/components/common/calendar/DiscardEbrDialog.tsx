"use client";

import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

type DiscardEbrDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DiscardEbrDialog({
  open,
  onClose,
  onConfirm,
}: DiscardEbrDialogProps) {
  const m = useTheme().palette.mollure;

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title="Discard edited booking request"
      onClose={onClose}
      maxWidth="sm"
      headerTone="danger"
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Discard"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 2.5, textAlign: "center" }}>
        <WarningAmberRoundedIcon
          sx={{ fontSize: 52, color: "#E85D5D", mb: 1.5 }}
        />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 14,
            color: alpha(m.navy, 0.88),
            lineHeight: 1.55,
            px: 1,
          }}
        >
          This will end the edited booking request. The client will no longer be able to respond.
        </Typography>
      </Box>
    </AppModal>
  );
}
