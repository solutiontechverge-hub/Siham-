"use client";

import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import AppModal from "../../common/AppModal";
import ModalConfirmBody from "../../common/ModalConfirmBody";
import { ModalCancelApplyFooter } from "../../common/FinanceDrawerFooter";

export type CancelPendingPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
};

export default function CancelPendingPaymentModal({
  open,
  onClose,
  onConfirm,
  title = "Cancel Pending Payment",
  message = "This will cancel the pending payment and cannot be undone.",
  confirmLabel = "Confirm",
}: CancelPendingPaymentModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      title={title}
      contentMinHeight={220}
      headerTone="danger"
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={onConfirm}
          primaryLabel={confirmLabel}
          primaryTone="danger"
          justifyContent="center"
          buttonSx={{ height: 40 }}
          spacing={1}
        />
      }
    >
      <ModalConfirmBody
        icon={
          <ReportProblemRoundedIcon sx={{ fontSize: 30, color: "#E53935" }} />
        }
        iconFrame="rounded"
        iconColor="#E53935"
        iconFrameSize={52}
        bodyMaxWidth={280}
        bodyOpacity={0.82}
        py={3}
        px={2.5}
        bodySx={{ fontSize: 15, lineHeight: 1.45 }}
        body={message}
      />
    </AppModal>
  );
}
