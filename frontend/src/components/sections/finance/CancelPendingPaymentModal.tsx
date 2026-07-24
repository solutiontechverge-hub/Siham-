"use client";

import AppButton from "../../common/AppButton";
import * as React from "react";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../../common/AppModal";

export type CancelPendingPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
};

export default function CancelPendingPaymentModal({
  open,
  onClose,
  onConfirm,
  title = "Cancel Pending Payment",
  message = "This will cancel the pending payment and cannot be undone.",
  confirmLabel = "Confirm",
}: CancelPendingPaymentModalProps) {
  const m = useTheme().palette.mollure;

  const footer = (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      sx={{ px: 2.5, py: 2 }}
    >
      <AppButton
        tone="secondary"
        onClick={onClose}
        sx={{
          height: 34,
        }}
      >
        Cancel
      </AppButton>
      <AppButton
        tone="primary"
        onClick={onConfirm}
        sx={{
          height: 34,
        }}
      >
        {confirmLabel}
      </AppButton>
    </Stack>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      title={title}
      contentMinHeight={220}
      headerTone="danger"
      footer={footer}
    >
      <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            mx: "auto",
            mb: 1.5,
            bgcolor: alpha("#E53935", 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ReportProblemRoundedIcon sx={{ fontSize: 30, color: "#E53935" }} />
        </Box>
        <Typography
          sx={{
            fontWeight: 900,
            color: alpha(m.navy, 0.82),
            fontSize: 15,
            lineHeight: 1.45,
            maxWidth: 280,
            mx: "auto",
          }}
        >
          {message}
        </Typography>
      </Box>
    </AppModal>
  );
}
