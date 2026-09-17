"use client";

import ModalActionConfirmDialog from "../ModalActionConfirmDialog";

type DiscardBookingDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
};

/** Shared danger discard modal (BR / EBR / ER). */
export default function DiscardBookingDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
}: DiscardBookingDialogProps) {
  return (
    <ModalActionConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      body={body}
      confirmLabel="Discard"
      headerTone="danger"
      showWarning
    />
  );
}
