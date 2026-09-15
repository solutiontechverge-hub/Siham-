"use client";

import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import AppButton from "../AppButton";
import AppModal from "../AppModal";
import ModalConfirmBody from "../ModalConfirmBody";
import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";

type FooterButton = {
  label: string;
  tone: "primary" | "secondary" | "danger";
  onClick: () => void;
};

type CalendarWarningConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  headerTone?: "default" | "danger";
  iconColor?: string;
  buttons: FooterButton[];
};

/** Shared warning-icon confirm modal used by schedule/catalog dialogs. */
export default function CalendarWarningConfirmDialog({
  open,
  onClose,
  title,
  message,
  headerTone = "danger",
  iconColor = "#E85D5D",
  buttons,
}: CalendarWarningConfirmDialogProps) {
  const [cancelBtn, primaryBtn] =
    buttons.length === 2 ? buttons : [undefined, undefined];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      fullWidth
      headerTone={headerTone}
      footer={
        cancelBtn && primaryBtn ? (
          <ModalCancelApplyFooter
            onCancel={cancelBtn.onClick}
            onPrimary={primaryBtn.onClick}
            cancelLabel={cancelBtn.label}
            primaryLabel={primaryBtn.label}
            primaryTone={primaryBtn.tone === "danger" ? "danger" : "primary"}
            justifyContent="center"
            buttonSx={{ height: 40, minWidth: 120 }}
            spacing={1.25}
          />
        ) : (
          <Box sx={{ px: 2.5, py: 2 }}>
            <Stack direction="row" justifyContent="center" spacing={1.25}>
              {buttons.map((btn) => (
                <AppButton
                  key={btn.label}
                  tone={btn.tone}
                  onClick={btn.onClick}
                  sx={{ height: 40, minWidth: 120 }}
                >
                  {btn.label}
                </AppButton>
              ))}
            </Stack>
          </Box>
        )
      }
    >
      <ModalConfirmBody
        body={message}
        showWarning
        iconSize={56}
        iconMb={1.75}
        iconColor={iconColor}
        py={3}
        px={2.5}
      />
    </AppModal>
  );
}
