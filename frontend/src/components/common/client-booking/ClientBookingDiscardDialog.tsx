"use client";

import AppModal, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "../AppModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ClientBookingDiscardDialog({ open, onClose, onConfirm }: Props) {
  return (
    <AppModal
      contentSx={{ px: 2.5, py: 1 }}
      footerVariant="actions"
      headerTone="danger"
      open={open}
      title="Are you sure you want to discard your BR? It will be deleted afterward."
      onClose={onClose}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Discard"
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
