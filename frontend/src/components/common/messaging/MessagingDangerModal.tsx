"use client";

import * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

type MessagingDangerModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryLabel?: string;
  cancelLabel?: string;
  onPrimary: () => void;
  embedded?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  primaryDisabled?: boolean;
  primaryTone?: "primary" | "danger";
  contentSx?: SxProps<Theme>;
};

/** Shared danger AppModal shell for messaging / client danger dialogs. */
export default function MessagingDangerModal({
  open,
  onClose,
  title,
  children,
  primaryLabel = "Delete",
  cancelLabel,
  onPrimary,
  embedded = false,
  maxWidth,
  primaryDisabled = false,
  primaryTone = "primary",
  contentSx = { px: 2.5 },
}: MessagingDangerModalProps) {
  return (
    <AppModal
      contentSx={contentSx}
      footerVariant="actions"
      headerTone="danger"
      open={open}
      title={title}
      onClose={onClose}
      embedded={embedded}
      maxWidth={maxWidth}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} label={cancelLabel} />
          <MessagingModalPrimaryButton
            label={primaryLabel}
            tone={primaryTone}
            disabled={primaryDisabled}
            onClick={onPrimary}
          />
        </>
      }
    >
      {children}
    </AppModal>
  );
}
