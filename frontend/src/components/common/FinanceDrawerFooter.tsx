"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import AppButton from "./AppButton";

type FinanceDrawerActionsFooterProps = {
  onCancel: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  cancelLabel?: string;
  primaryDisabled?: boolean;
};

/** Standard finance drawer footer: Cancel + primary action aligned right. */
export function FinanceDrawerActionsFooter({
  onCancel,
  onPrimary,
  primaryLabel,
  cancelLabel = "Cancel",
  primaryDisabled = false,
}: FinanceDrawerActionsFooterProps) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      justifyContent="flex-end"
      sx={{ px: 2.5, py: 1.75 }}
    >
      <AppButton tone="secondary" onClick={onCancel}>
        {cancelLabel}
      </AppButton>
      <AppButton tone="primary" disabled={primaryDisabled} onClick={onPrimary}>
        {primaryLabel}
      </AppButton>
    </Stack>
  );
}

type FinanceDrawerFiltersFooterProps = {
  onCancel: () => void;
  onReset: () => void;
  onApply: () => void;
};

/** Finance filters drawer footer: Cancel, Reset, Apply (full width). */
export function FinanceDrawerFiltersFooter({
  onCancel,
  onReset,
  onApply,
}: FinanceDrawerFiltersFooterProps) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ px: 2.5, py: 1.75 }}>
      <AppButton
        fullWidth
        tone="secondary"
        presetSize="md"
        onClick={onCancel}
        sx={{ height: 38 }}
      >
        Cancel
      </AppButton>
      <AppButton
        fullWidth
        tone="secondary"
        presetSize="md"
        onClick={onReset}
        sx={{ height: 38 }}
      >
        Reset
      </AppButton>
      <AppButton
        fullWidth
        tone="primary"
        presetSize="md"
        onClick={onApply}
        sx={{ height: 38 }}
      >
        Apply
      </AppButton>
    </Stack>
  );
}
