"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, IconButton, Typography } from "@mui/material";
import {
  getMollureSnackbarColors,
  type MollureSnackbarSeverity,
} from "../../theme/mollureSnackbar";

export type MollureSnackbarAlertProps = {
  message: React.ReactNode;
  severity?: MollureSnackbarSeverity;
  onClose?: () => void;
  fullWidth?: boolean;
};

const MollureSnackbarAlert = React.forwardRef<
  HTMLDivElement,
  MollureSnackbarAlertProps
>(function MollureSnackbarAlert(
  { message, severity = "success", onClose, fullWidth = false },
  ref,
) {
  const colors = getMollureSnackbarColors(severity);

  return (
    <Box
      ref={ref}
      role="alert"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        minWidth: fullWidth ? 0 : { xs: "min(100%, 320px)", sm: 360 },
        width: fullWidth ? "100%" : undefined,
        maxWidth: "100%",
        px: 2,
        py: 1.35,
        borderRadius: "14px",
        bgcolor: colors.background,
        color: colors.foreground,
        boxShadow: "0 4px 24px rgba(16, 24, 40, 0.08)",
      }}
    >
      <Typography
        component="span"
        sx={{
          flex: 1,
          fontWeight: 500,
          fontSize: "0.875rem",
          lineHeight: 1.4,
          color: "inherit",
        }}
      >
        {message}
      </Typography>
      {onClose ? (
        <IconButton
          size="small"
          aria-label="Close notification"
          onClick={onClose}
          sx={{
            flexShrink: 0,
            p: 0.35,
            color: "inherit",
            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
    </Box>
  );
});

export default MollureSnackbarAlert;
