"use client";

import * as React from "react";
import { Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export function financeDrawerCancelButtonSx(m: { navy: string }) {
  return {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 800,
    borderColor: alpha(m.navy, 0.14),
    color: alpha(m.navy, 0.72),
    bgcolor: "#fff",
    height: 36,
    px: 2.25,
    minWidth: 92,
  } as const;
}

export function financeDrawerPrimaryButtonSx(m: { teal: string; tealDark: string }) {
  return {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 900,
    bgcolor: m.teal,
    color: "#fff",
    "&:hover": { bgcolor: m.tealDark },
    height: 36,
    px: 2.25,
    minWidth: 92,
  } as const;
}

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
  const m = useTheme().palette.mollure;

  return (
    <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ px: 2.5, py: 1.75 }}>
      <Button variant="outlined" onClick={onCancel} sx={financeDrawerCancelButtonSx(m)}>
        {cancelLabel}
      </Button>
      <Button
        variant="contained"
        disableElevation
        disabled={primaryDisabled}
        onClick={onPrimary}
        sx={{
          ...financeDrawerPrimaryButtonSx(m),
          "&.Mui-disabled": {
            bgcolor: alpha(m.navy, 0.12),
            color: alpha(m.navy, 0.35),
          },
        }}
      >
        {primaryLabel}
      </Button>
    </Stack>
  );
}

type FinanceDrawerFiltersFooterProps = {
  onCancel: () => void;
  onReset: () => void;
  onApply: () => void;
};

/** Finance filters drawer footer: Cancel, Reset, Apply (full width). */
export function FinanceDrawerFiltersFooter({ onCancel, onReset, onApply }: FinanceDrawerFiltersFooterProps) {
  const m = useTheme().palette.mollure;
  const sharedSx = {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 800,
    height: 38,
  } as const;

  return (
    <Stack direction="row" spacing={1.25} sx={{ px: 2.5, py: 1.75 }}>
      <Button
        fullWidth
        variant="outlined"
        onClick={onCancel}
        sx={{ ...sharedSx, borderColor: alpha(m.navy, 0.14), color: alpha(m.navy, 0.72), bgcolor: "#fff" }}
      >
        Cancel
      </Button>
      <Button
        fullWidth
        variant="outlined"
        onClick={onReset}
        sx={{ ...sharedSx, borderColor: alpha(m.navy, 0.14), color: alpha(m.navy, 0.72), bgcolor: "#fff" }}
      >
        Reset
      </Button>
      <Button
        fullWidth
        variant="contained"
        disableElevation
        onClick={onApply}
        sx={{ ...sharedSx, bgcolor: m.teal, color: "#fff", "&:hover": { bgcolor: m.tealDark } }}
      >
        Apply
      </Button>
    </Stack>
  );
}
