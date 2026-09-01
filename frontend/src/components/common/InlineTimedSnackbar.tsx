"use client";

import * as React from "react";
import { Box } from "@mui/material";
import MollureSnackbarAlert from "./MollureSnackbarAlert";
import type { MollureSnackbarSeverity } from "../../theme/mollureSnackbar";

type InlineTimedSnackbarProps = {
  open: boolean;
  message: React.ReactNode;
  severity?: MollureSnackbarSeverity;
  durationMs?: number;
  onClose: () => void;
};

export default function InlineTimedSnackbar({
  open,
  message,
  severity = "success",
  durationMs = 30000,
  onClose,
}: InlineTimedSnackbarProps) {
  React.useEffect(() => {
    if (!open || message == null || message === "") return;
    const timer = window.setTimeout(() => onClose(), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onClose, open]);

  if (!open || message == null || message === "") return null;

  return (
    <Box sx={{ mt: 1.25, width: "100%" }}>
      <MollureSnackbarAlert
        message={message}
        severity={severity}
        fullWidth
        onClose={onClose}
      />
    </Box>
  );
}
