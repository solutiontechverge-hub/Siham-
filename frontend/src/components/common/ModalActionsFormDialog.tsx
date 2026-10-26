"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "./AppModal";
import { mollureBodySx } from "../../theme/mollureHierarchy";

type ModalActionsFormDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  primaryDisabled?: boolean;
  description?: string;
  cancelLabel?: string;
  embedded?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  headerTone?: "default" | "danger";
};

/** AppModal + actions footer + optional description for note/form dialogs. */
export default function ModalActionsFormDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  primaryDisabled = false,
  description,
  cancelLabel,
  embedded = false,
  maxWidth = "sm",
  headerTone = "default",
}: ModalActionsFormDialogProps) {
  const m = useTheme().palette.mollure;

  const handleSubmit = () => {
    if (primaryDisabled) return;
    onConfirm();
  };

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={title}
      onClose={onClose}
      maxWidth={maxWidth}
      embedded={embedded}
      headerTone={headerTone}
      onFormSubmit={handleSubmit}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} label={cancelLabel} />
          <MessagingModalPrimaryButton
            type="submit"
            label={confirmLabel}
            disabled={primaryDisabled}
          />
        </>
      }
    >
      {description ? (
        <Box sx={{ pt: 0.5, pb: 0.5 }}>
          <Typography sx={mollureBodySx(m.navy, { mb: 1.5, lineHeight: 1.45 })}>
            {description}
          </Typography>
          {children}
        </Box>
      ) : (
        children
      )}
    </AppModal>
  );
}
