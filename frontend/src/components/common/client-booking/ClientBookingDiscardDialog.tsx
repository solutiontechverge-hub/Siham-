"use client";

import { ClientEmptyDangerDialog } from "./ClientEmptyDangerDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ClientBookingDiscardDialog({
  open,
  onClose,
  onConfirm,
}: Props) {
  return (
    <ClientEmptyDangerDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLabel="Discard"
      title="Are you sure you want to discard your BR? It will be deleted afterward."
    />
  );
}
