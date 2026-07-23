"use client";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
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
        <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={confirming}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
              bgcolor: "#fff",
              height: 36,
              px: 2.25,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={confirming}
            onClick={onConfirm}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 900,
              bgcolor: m.teal,
              color: "#fff",
              "&:hover": { bgcolor: m.tealDark },
              height: 36,
              px: 2.25,
            }}
          >
            Confirm
          </Button>
        </Stack>
      }
    >
      <Stack alignItems="center" spacing={1.5} sx={{ px: 1, py: 1.5, textAlign: "center" }}>
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
        <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.82), lineHeight: 1.45 }}>
          This pending sales record will be removed and the payment link will be deactivated. The client
          will no longer be able to complete the payment
        </Typography>
      </Stack>
    </AppModal>
  );
}
