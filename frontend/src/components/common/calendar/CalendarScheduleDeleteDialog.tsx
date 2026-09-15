"use client";

import CalendarWarningConfirmDialog from "./CalendarWarningConfirmDialog";

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
  const copy = copyByVariant[variant];

  return (
    <CalendarWarningConfirmDialog
      open={open}
      onClose={onClose}
      title={copy.title}
      message={copy.message}
      buttons={[
        { label: "Cancel", tone: "secondary", onClick: onClose },
        {
          label: copy.confirmLabel,
          tone: "danger",
          onClick: () => {
            onConfirm();
            onClose();
          },
        },
      ]}
    />
  );
}
