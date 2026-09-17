"use client";

import MessagingDangerModal from "../messaging/MessagingDangerModal";

type ClientEmptyDangerDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel: string;
};

/** Empty-body danger confirm (delete / discard list actions). */
export function ClientEmptyDangerDialog({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel,
}: ClientEmptyDangerDialogProps) {
  return (
    <MessagingDangerModal
      open={open}
      onClose={onClose}
      title={title}
      primaryLabel={confirmLabel}
      primaryTone="danger"
      contentSx={{ px: 2.5, py: 1 }}
      onPrimary={() => {
        onConfirm();
        onClose();
      }}
    >
      {null}
    </MessagingDangerModal>
  );
}
