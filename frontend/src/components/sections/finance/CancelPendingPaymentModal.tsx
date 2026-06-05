"use client";

import * as React from "react";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureModal from "../../common/MollureModal";

export type CancelPendingPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelPendingPaymentModal({
  open,
  onClose,
  onConfirm,
}: CancelPendingPaymentModalProps) {
  const m = useTheme().palette.mollure;

  const footer = (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ px: 2.5, py: 2 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 800,
          borderColor: alpha(m.navy, 0.14),
          color: alpha(m.navy, 0.72),
          bgcolor: "#fff",
          height: 34,
          px: 2.25,
          minWidth: 92,
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        disableElevation
        onClick={onConfirm}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 900,
          bgcolor: m.teal,
          "&:hover": { bgcolor: m.tealDark },
          height: 34,
          px: 2.25,
          minWidth: 92,
        }}
      >
        Confirm
      </Button>
    </Stack>
  );

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      title="Cancel Pending Payment"
      contentMinHeight={220}
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
          This will cancel the pending payment and cannot be undone.
        </Typography>
      </Box>
    </MollureModal>
  );
}
