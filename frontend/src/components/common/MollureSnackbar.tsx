"use client";

import * as React from "react";
import { Box, Portal, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";
import MollureSnackbarAlert from "./MollureSnackbarAlert";
import type { MollureSnackbarSeverity } from "../../theme/mollureSnackbar";

export type MollureSnackbarProps = {
  open: boolean;
  message: React.ReactNode;
  severity?: MollureSnackbarSeverity;
  onClose: () => void;
  autoHideDuration?: number;
};

export default function MollureSnackbar({
  open,
  message,
  severity = "success",
  onClose,
  autoHideDuration = 4000,
}: MollureSnackbarProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const isClientApp = Boolean(pathname?.startsWith("/clients"));

  React.useEffect(() => {
    if (!open || autoHideDuration == null) return;
    const timer = window.setTimeout(() => onClose(), autoHideDuration);
    return () => window.clearTimeout(timer);
  }, [open, autoHideDuration, onClose]);

  if (!open || message == null || message === "") return null;

  return (
    <Portal>
      <Box
        role="presentation"
        sx={{
          position: "fixed",
          zIndex: theme.zIndex.snackbar + 10,
          left: 0,
          right: 0,
          ...(isClientApp
            ? { bottom: { xs: 16, sm: 24 } }
            : { top: { xs: 16, sm: 24 } }),
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
          pointerEvents: "none",
          "& > *": { pointerEvents: "auto" },
        }}
      >
        <MollureSnackbarAlert
          message={message}
          severity={severity}
          onClose={onClose}
        />
      </Box>
    </Portal>
  );
}
