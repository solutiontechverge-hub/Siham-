"use client";

import { ClientEmptyDangerDialog } from "./ClientEmptyDangerDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant?: "cancelled" | "completed";
};

export default function ClientBookingDeleteDialog({
  open,
  onClose,
  onConfirm,
  variant = "cancelled",
}: Props) {
  return (
    <ClientEmptyDangerDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLabel="Delete"
      title={
        variant === "completed"
          ? "Remove this completed booking from your list?"
          : "Remove this cancelled booking from your list?"
      }
    />
  );
}
