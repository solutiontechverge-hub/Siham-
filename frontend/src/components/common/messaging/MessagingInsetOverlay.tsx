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
  /** Soft teal by default; soft red for destructive confirmations. */
  headerTone?: "default" | "danger";
};

export default function MessagingInsetOverlay({
  open,
  title,
  onClose,
  children,
  footer,
  hideDivider,
  maxWidth = 400,
  headerTone = "default",
}: MessagingInsetOverlayProps) {
  const m = useTheme().palette.mollure;
  const headerBg = headerTone === "danger" ? alpha("#E85D5D", 0.14) : alpha(m.teal, 0.12);

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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 1.75,
            flexShrink: 0,
            bgcolor: headerBg,
            color: m.navy,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 16 }, color: alpha(m.navy, 0.9) }}>{title}</Typography>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close"
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              color: alpha(m.navy, 0.55),
              bgcolor: alpha(m.navy, 0.06),
              "&:hover": { bgcolor: alpha(m.navy, 0.12) },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 1.75, sm: 2 }, pb: footer ? 1 : { xs: 2, sm: 2.5 }, overflowY: "auto", flex: 1, minHeight: 0 }}>
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
