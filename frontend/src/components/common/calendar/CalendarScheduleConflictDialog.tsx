"use client";

import AppButton from "../AppButton";
import { Box, Stack, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";

export type CalendarScheduleConflictKind =
  | "availability_set"
  | "timeslot_blocked"
  | "cancel_bookings";

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
  cancel_bookings: {
    title: "Cancel active bookings?",
    message:
      "Cancel active bookings in this timeslot? Prepaid bookings become Cancelled with a refund icon.",
    confirmLabel: "Yes",
    confirmTone: "danger",
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
  const ackOnly = kind !== "cancel_bookings";

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
                  No
                </AppButton>
                <AppButton
                  tone="danger"
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
          sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }}
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
