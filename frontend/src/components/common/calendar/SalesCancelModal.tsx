"use client";

import AppModal from "../AppModal";
import ModalConfirmBody from "../ModalConfirmBody";
import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";

type SalesCancelModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export default function SalesCancelModal({
  open,
  onClose,
  onConfirm,
  confirming = false,
}: SalesCancelModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Cancel Sales"
      maxWidth="xs"
      headerTone="danger"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={onConfirm}
          primaryLabel="Confirm"
          cancelDisabled={confirming}
          primaryDisabled={confirming}
          justifyContent="center"
          buttonSx={{ height: 40, minWidth: 120 }}
          spacing={1.25}
        />
      }
    >
      <ModalConfirmBody
        showWarning
        iconColor="#F04438"
        iconSize={56}
        iconMb={1.75}
        bodyOpacity={0.82}
        py={3}
        px={2.5}
        bodySx={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.45 }}
        body="This pending sales record will be removed and the payment link will be deactivated. The client will no longer be able to complete the payment"
      />
    </AppModal>
  );
}
