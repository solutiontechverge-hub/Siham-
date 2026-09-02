"use client";

import AppButton from "../AppButton";
import { Box, Stack, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";

export type CalendarScheduleConflictKind =
  | "availability_set"
  | "timeslot_blocked"
  | "overlap_booking";

type CalendarScheduleConflictDialogProps = {
  open: boolean;
  kind: CalendarScheduleConflictKind | null;
  onClose: () => void;
  onConfirm: () => void;
};

const COPY: Record<
  CalendarScheduleConflictKind,
  { title: string; message: string; confirmLabel: string; confirmTone: "primary" | "danger" }
> = {
  availability_set: {
    title: "Availability already set",
    message: "Availability is already set for this team member in the selected timeslot.",
    confirmLabel: "OK",
    confirmTone: "primary",
  },
  timeslot_blocked: {
    title: "Timeslot already blocked",
    message: "This timeslot is already blocked for the selected team member.",
    confirmLabel: "OK",
    confirmTone: "primary",
  },
  overlap_booking: {
    title: "Block Time overlaps a booking",
    message:
      "This timeslot already has a booking. You can still add Block Time. Reschedule or cancel the booking and notify the client.",
    confirmLabel: "Continue",
    confirmTone: "primary",
  },
};

export default function CalendarScheduleConflictDialog({
  open,
  kind,
  onClose,
  onConfirm,
}: CalendarScheduleConflictDialogProps) {
  const m = useTheme().palette.mollure;
  if (!kind) return null;
  const copy = COPY[kind];
  const ackOnly = kind !== "overlap_booking";

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={copy.title}
      maxWidth="sm"
      fullWidth
      headerTone={copy.confirmTone === "danger" ? "danger" : "default"}
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="center" spacing={1.25}>
            {ackOnly ? (
              <AppButton
                tone="primary"
                onClick={onClose}
                sx={{ height: 40, minWidth: 120 }}
              >
                {copy.confirmLabel}
              </AppButton>
            ) : (
              <>
                <AppButton
                  tone="secondary"
                  onClick={onClose}
                  sx={{ height: 40, minWidth: 120 }}
                >
                  Cancel
                </AppButton>
                <AppButton
                  tone="primary"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  sx={{ height: 40, minWidth: 120 }}
                >
                  {copy.confirmLabel}
                </AppButton>
              </>
            )}
          </Stack>
        </Box>
      }
    >
      <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
        <WarningAmberRoundedIcon
          sx={{ fontSize: 56, color: m.statusOrangeFg, mb: 1.75 }}
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
          {copy.message}
        </Typography>
      </Box>
    </AppModal>
  );
}
