"use client";

import AppModal, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../AppModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant?: "cancelled" | "completed";
};

export default function ClientBookingDeleteDialog({ open, onClose, onConfirm, variant = "cancelled" }: Props) {
  const title =
    variant === "completed"
      ? "Remove this completed booking from your list?"
      : "Remove this cancelled booking from your list?";

  return (
    <AppModal
      contentSx={{ px: 2.5, py: 1 }}
      footerVariant="actions"
      headerTone="danger"
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Delete"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      {null}
    </AppModal>
  );
}
