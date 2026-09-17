"use client";

import ModalActionConfirmDialog from "../ModalActionConfirmDialog";

export type CalendarBookingAction = "cancel" | "in_progress";

type Props = {
  open: boolean;
  action: CalendarBookingAction | null;
  onClose: () => void;
  onConfirm: () => void;
};

const COPY: Record<
  CalendarBookingAction,
  { title: string; body: string; confirmLabel: string; showWarning?: boolean }
> = {
  cancel: {
    title: "Cancel booking",
    body: "Are you sure you want to cancel this booking? This action cannot be undone.",
    confirmLabel: "Cancel booking",
    showWarning: true,
  },
  in_progress: {
    title: "Mark in progress",
    body: "Are you sure you want to mark this booking as in progress?",
    confirmLabel: "Mark in progress",
  },
};

export default function CalendarBookingActionConfirmDialog({
  open,
  action,
  onClose,
  onConfirm,
}: Props) {
  if (!action) return null;
  const copy = COPY[action];

  return (
    <ModalActionConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
      headerTone={action === "cancel" ? "danger" : "default"}
      showWarning={copy.showWarning}
    />
  );
}
