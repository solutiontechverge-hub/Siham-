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
          buttonSx={{}}
          spacing={1.25}
        />
      }
    >
      <ModalConfirmBody
        showWarning
        iconFrame="circle"
        iconColor="#F04438"
        iconFrameSize={56}
        iconSize={30}
        bodyOpacity={0.82}
        py={1.5}
        px={1}
        bodySx={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.45 }}
        body="This pending sales record will be removed and the payment link will be deactivated. The client will no longer be able to complete the payment"
      />
    </AppModal>
  );
}
