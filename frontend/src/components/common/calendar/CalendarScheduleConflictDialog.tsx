"use client";

import { useTheme } from "@mui/material/styles";
import CalendarWarningConfirmDialog from "./CalendarWarningConfirmDialog";

export type CalendarScheduleConflictKind =
  | "availability_set"
  | "timeslot_blocked"
  | "overlap_booking"
  | "staff_double_book";

type CalendarScheduleConflictDialogProps = {
  open: boolean;
  kind: CalendarScheduleConflictKind | null;
  onClose: () => void;
  onConfirm: () => void;
  messageOverride?: string | null;
};

const COPY: Record<
  CalendarScheduleConflictKind,
  { title: string; message: string; confirmLabel: string }
> = {
  availability_set: {
    title: "Availability already set",
    message:
      "Availability is already set for this team member in the selected timeslot.",
    confirmLabel: "OK",
  },
  timeslot_blocked: {
    title: "Timeslot already blocked",
    message: "This timeslot is already blocked for the selected team member.",
    confirmLabel: "OK",
  },
  overlap_booking: {
    title: "Block Time overlaps a booking",
    message:
      "This timeslot already has a booking. You can still add Block Time. Reschedule or cancel the booking and notify the client.",
    confirmLabel: "Continue",
  },
  staff_double_book: {
    title: "Overlapping staff time",
    message:
      "One or more services overlap for the same team member. You can still save this booking.",
    confirmLabel: "Continue",
  },
};

export default function CalendarScheduleConflictDialog({
  open,
  kind,
  onClose,
  onConfirm,
  messageOverride = null,
}: CalendarScheduleConflictDialogProps) {
  const m = useTheme().palette.mollure;
  if (!kind) return null;
  const copy = COPY[kind];
  const message = messageOverride?.trim() || copy.message;
  const ackOnly =
    kind !== "overlap_booking" && kind !== "staff_double_book";

  return (
    <CalendarWarningConfirmDialog
      open={open}
      onClose={onClose}
      title={copy.title}
      message={message}
      headerTone="default"
      iconColor={m.statusOrangeFg}
      buttons={
        ackOnly
          ? [{ label: copy.confirmLabel, tone: "primary", onClick: onClose }]
          : [
              { label: "Cancel", tone: "secondary", onClick: onClose },
              {
                label: copy.confirmLabel,
                tone: "primary",
                onClick: () => {
                  onConfirm();
                  onClose();
                },
              },
            ]
      }
    />
  );
}
