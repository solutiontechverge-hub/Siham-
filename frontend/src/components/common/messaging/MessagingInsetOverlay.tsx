"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, DialogActions, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type MessagingInsetOverlayProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideDivider?: boolean;
  maxWidth?: number;
};

export default function MessagingInsetOverlay({
  open,
  title,
  onClose,
  children,
  footer,
  hideDivider,
  maxWidth = 400,
}: MessagingInsetOverlayProps) {
  const m = useTheme().palette.mollure;

  if (!open) return null;

  return (
    <Box
      role="presentation"
      onClick={onClose}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(m.navy, 0.2),
        p: { xs: 1.25, sm: 2 },
      }}
    >
      <Paper
        elevation={8}
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: maxWidth },
          maxHeight: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
        }}
      >
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 1.75, sm: 2 }, pb: 1, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 16 }, color: alpha(m.navy, 0.88) }}>{title}</Typography>
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Close"
              sx={{
                bgcolor: alpha(m.navy, 0.06),
                width: 28,
                height: 28,
                "&:hover": { bgcolor: alpha(m.navy, 0.1) },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.45) }} />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 0, pb: footer ? 1 : { xs: 2, sm: 2.5 }, overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </Box>

        {footer ? (
          <DialogActions
            sx={{
              px: { xs: 2, sm: 2.5 },
              pb: { xs: 2, sm: 2.5 },
              pt: hideDivider ? 0 : 1,
              justifyContent: "center",
              gap: 1.5,
              flexShrink: 0,
              borderTop: hideDivider ? "none" : `1px solid ${alpha(m.navy, 0.08)}`,
            }}
          >
            {footer}
          </DialogActions>
        ) : null}
      </Paper>
    </Box>
  );
}
