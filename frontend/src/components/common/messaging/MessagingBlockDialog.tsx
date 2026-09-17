"use client";

import type { MessagingAudience } from "./messagingRoutes";
import { getBlockModalCopy } from "./messagingPeerLabels";
import ModalConfirmBody from "../ModalConfirmBody";
import MessagingDangerModal from "./MessagingDangerModal";

type Props = {
  open: boolean;
  audience: MessagingAudience;
  onClose: () => void;
  onConfirm: () => void;
  embedded?: boolean;
};

export default function MessagingBlockDialog({
  open,
  audience,
  onClose,
  onConfirm,
  embedded = false,
}: Props) {
  const copy = getBlockModalCopy(audience);

  return (
    <MessagingDangerModal
      open={open}
      onClose={onClose}
      title={copy.title}
      embedded={embedded}
      primaryLabel={copy.confirmLabel}
      onPrimary={() => {
        onConfirm();
        onClose();
      }}
    >
      <ModalConfirmBody body={copy.message} bodyOpacity={0.85} />
    </MessagingDangerModal>
  );
}
