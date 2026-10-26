"use client";

import * as React from "react";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "./AppModal";
import ModalConfirmBody from "./ModalConfirmBody";

type ModalActionConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  headerTone?: "danger" | "default";
  primaryTone?: "primary" | "danger";
  showWarning?: boolean;
  bodyOpacity?: number;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  /** Await onConfirm and block dismiss while submitting (booking request flow). */
  awaitConfirm?: boolean;
};

/** Shared confirm shell: AppModal + ModalConfirmBody + Cancel/Primary footer. */
export default function ModalActionConfirmDialog({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  onConfirm,
  headerTone = "default",
  primaryTone = "primary",
  showWarning = false,
  bodyOpacity,
  maxWidth = "sm",
  awaitConfirm = false,
}: ModalActionConfirmDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const busy = awaitConfirm && submitting;

  const handlePrimary = () => {
    if (!awaitConfirm) {
      void onConfirm();
      onClose();
      return;
    }
    void (async () => {
      setSubmitting(true);
      try {
        await onConfirm();
        onClose();
      } catch {
        // Caller shows the error snackbar.
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={title}
      onClose={busy ? () => undefined : onClose}
      maxWidth={maxWidth}
      headerTone={headerTone}
      onFormSubmit={() => {
        if (busy) return;
        handlePrimary();
      }}
      footer={
        <>
          <MessagingModalCancelButton
            onClick={onClose}
            disabled={busy}
            type="button"
          />
          <MessagingModalPrimaryButton
            type="submit"
            label={confirmLabel}
            tone={primaryTone}
            disabled={busy}
          />
        </>
      }
    >
      <ModalConfirmBody
        body={body}
        showWarning={showWarning}
        bodyOpacity={bodyOpacity}
      />
    </AppModal>
  );
}
