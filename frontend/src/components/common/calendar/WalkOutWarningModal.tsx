"use client";

import AppModal from "../AppModal";
import ModalConfirmBody from "../ModalConfirmBody";
import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";

type WalkOutWarningModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
};

/** Placeholder for unpaid walk-out (30 min past end) checkout warning. */
export default function WalkOutWarningModal({
  open,
  onClose,
  onConfirm,
}: WalkOutWarningModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Walk-out / unpaid checkout"
      maxWidth="xs"
      headerTone="danger"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={onConfirm ?? onClose}
          primaryLabel="Continue"
          buttonSx={{}}
          spacing={1.25}
        />
      }
    >
      {/* ponytail: stub copy + no auto-complete wiring; wire checkout warning UX when product copy/actions land */}
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
        body="Placeholder: this booking is past the 30-minute walk-out grace without checkout/payment. Confirm how to proceed."
      />
    </AppModal>
  );
}
