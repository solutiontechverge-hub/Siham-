"use client";

import AppButton from "../AppButton";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";

type SalesCancelModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export default function SalesCancelModal({
  open,
  onClose,
  onConfirm,
  confirming = false,
}: SalesCancelModalProps) {
  const m = useTheme().palette.mollure;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Cancel Sales"
      maxWidth="xs"
      headerTone="danger"
      footer={
        <Stack
          direction="row"
          spacing={1.25}
          justifyContent="flex-end"
          sx={{ px: 2.5, py: 2 }}
        >
          <AppButton tone="secondary" onClick={onClose} disabled={confirming}>
            Cancel
          </AppButton>
          <AppButton tone="primary" disabled={confirming} onClick={onConfirm}>
            Confirm
          </AppButton>
        </Stack>
      }
    >
      <Stack
        alignItems="center"
        spacing={1.5}
        sx={{ px: 1, py: 1.5, textAlign: "center" }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: alpha("#F04438", 0.12),
            display: "grid",
            placeItems: "center",
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 30, color: "#F04438" }} />
        </Box>
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 800,
            color: alpha(m.navy, 0.82),
            lineHeight: 1.45,
          }}
        >
          This pending sales record will be removed and the payment link will be
          deactivated. The client will no longer be able to complete the payment
        </Typography>
      </Stack>
    </AppModal>
  );
}
