"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import MollureModal from "../MollureModal";

export type CalendarScheduleDeleteVariant = "availability" | "blocked";

type CalendarScheduleDeleteDialogProps = {
  open: boolean;
  variant: CalendarScheduleDeleteVariant;
  onClose: () => void;
  onConfirm: () => void;
};

const copyByVariant = {
  availability: {
    title: "Cancel Availability",
    message: "Bookings during this period will be cancelled",
    confirmLabel: "Yes, Cancel",
  },
  blocked: {
    title: "Delete Blocked Time",
    message: "Are you sure you want to delete this blocked time entry?",
    confirmLabel: "Yes, Delete",
  },
} as const;

export default function CalendarScheduleDeleteDialog({
  open,
  variant,
  onClose,
  onConfirm,
}: CalendarScheduleDeleteDialogProps) {
  const m = useTheme().palette.mollure;
  const copy = copyByVariant[variant];

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title={copy.title}
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="center" spacing={1.25}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 40,
                minWidth: 120,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                onConfirm();
                onClose();
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 40,
                minWidth: 120,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              {copy.confirmLabel}
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
        <WarningAmberRoundedIcon sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }} />
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88), lineHeight: 1.55, px: 1 }}>
          {copy.message}
        </Typography>
      </Box>
    </MollureModal>
  );
}
