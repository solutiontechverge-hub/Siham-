"use client";

import * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import AppButton from "./AppButton";

type FinanceDrawerActionsFooterProps = {
  onCancel: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  cancelLabel?: string;
  cancelDisabled?: boolean;
  primaryDisabled?: boolean;
  cancelSx?: SxProps<Theme>;
  primarySx?: SxProps<Theme>;
  fullWidth?: boolean;
  spacing?: number;
  stackSx?: SxProps<Theme>;
};

/** Standard drawer footer: Cancel + primary action aligned right (or full width). */
export function FinanceDrawerActionsFooter({
  onCancel,
  onPrimary,
  primaryLabel,
  cancelLabel = "Cancel",
  cancelDisabled = false,
  primaryDisabled = false,
  cancelSx,
  primarySx,
  fullWidth = false,
  spacing = 1.25,
  stackSx,
}: FinanceDrawerActionsFooterProps) {
  return (
    <Stack
      direction="row"
      spacing={spacing}
      justifyContent={fullWidth ? undefined : "flex-end"}
      sx={{ px: 2.5, py: 1.75, width: fullWidth ? "100%" : undefined, ...stackSx }}
    >
      <AppButton
        tone="secondary"
        onClick={onCancel}
        disabled={cancelDisabled}
        fullWidth={fullWidth}
        sx={cancelSx}
      >
        {cancelLabel}
      </AppButton>
      <AppButton
        tone="primary"
        disabled={primaryDisabled}
        onClick={onPrimary}
        fullWidth={fullWidth}
        sx={primarySx}
      >
        {primaryLabel}
      </AppButton>
    </Stack>
  );
}

type ModalCancelApplyFooterProps = {
  onCancel: () => void;
  onPrimary: () => void;
  primaryLabel?: string;
  cancelLabel?: string;
  primaryDisabled?: boolean;
  cancelDisabled?: boolean;
  primaryTone?: "primary" | "danger";
  justifyContent?: "flex-end" | "center";
  /** Default calendar modal button size. Pass `{}` to skip size presets. */
  buttonSx?: SxProps<Theme>;
  stackSx?: SxProps<Theme>;
  spacing?: number;
};

/** Shared Cancel + Apply/Save footer used by calendar AppModals. */
export function ModalCancelApplyFooter({
  onCancel,
  onPrimary,
  primaryLabel = "Apply",
  cancelLabel = "Cancel",
  primaryDisabled = false,
  cancelDisabled = false,
  primaryTone = "primary",
  justifyContent = "flex-end",
  buttonSx,
  stackSx,
  spacing = 1.25,
}: ModalCancelApplyFooterProps) {
  const resolvedButtonSx = buttonSx ?? { height: 38, minWidth: 110 };

  return (
    <Stack
      direction="row"
      spacing={spacing}
      justifyContent={justifyContent}
      sx={{ px: 2.5, py: 2, ...stackSx }}
    >
      <AppButton
        tone="secondary"
        onClick={onCancel}
        disabled={cancelDisabled}
        sx={resolvedButtonSx}
      >
        {cancelLabel}
      </AppButton>
      <AppButton
        tone={primaryTone}
        disabled={primaryDisabled}
        onClick={onPrimary}
        sx={resolvedButtonSx}
      >
        {primaryLabel}
      </AppButton>
    </Stack>
  );
}

type FinanceDrawerFiltersFooterProps = {
  onCancel: () => void;
  onReset: () => void;
  onApply: () => void;
  cancelLabel?: string;
  resetLabel?: string;
  applyLabel?: string;
  spacing?: number;
  stackSx?: SxProps<Theme>;
  buttonSx?: SxProps<Theme>;
  presetSize?: "sm" | "md" | "lg";
};

/** Finance filters drawer footer: Cancel, Reset, Apply (full width). */
export function FinanceDrawerFiltersFooter({
  onCancel,
  onReset,
  onApply,
  cancelLabel = "Cancel",
  resetLabel = "Reset",
  applyLabel = "Apply",
  spacing = 1.25,
  stackSx,
  buttonSx = { height: 38 },
  presetSize = "md",
}: FinanceDrawerFiltersFooterProps) {
  const buttons = [
    { label: cancelLabel, onClick: onCancel, tone: "secondary" as const },
    { label: resetLabel, onClick: onReset, tone: "secondary" as const },
    { label: applyLabel, onClick: onApply, tone: "primary" as const },
  ];

  return (
    <Stack
      direction="row"
      spacing={spacing}
      sx={{ px: 2.5, py: 1.75, ...stackSx }}
    >
      {buttons.map((btn) => (
        <AppButton
          key={btn.label}
          fullWidth
          tone={btn.tone}
          presetSize={presetSize}
          onClick={btn.onClick}
          sx={buttonSx}
        >
          {btn.label}
        </AppButton>
      ))}
    </Stack>
  );
}
