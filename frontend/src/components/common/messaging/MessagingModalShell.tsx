"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type MessagingModalShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: "xs" | "sm";
  footer?: React.ReactNode;
  hideDivider?: boolean;
};

export default function MessagingModalShell({
  open,
  title,
  onClose,
  children,
  maxWidth = "xs",
  footer,
  hideDivider,
}: MessagingModalShellProps) {
  const m = useTheme().palette.mollure;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontWeight: 900, fontSize: 16, color: alpha(m.navy, 0.88) }}>{title}</Typography>
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

      <DialogContent sx={{ px: 2.5, pt: 0, pb: footer ? 1 : 2.5 }}>{children}</DialogContent>

      {footer ? (
        <DialogActions
          sx={{
            px: 2.5,
            pb: 2.5,
            pt: hideDivider ? 0 : 1,
            justifyContent: "center",
            gap: 1.5,
            borderTop: hideDivider ? "none" : `1px solid ${alpha(m.navy, 0.08)}`,
          }}
        >
          {footer}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}

export function MessagingModalCancelButton({ onClick, label = "Cancel" }: { onClick: () => void; label?: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontWeight: 800,
        fontSize: 13,
        minWidth: 100,
        borderRadius: "10px",
        borderColor: alpha(m.navy, 0.18),
        color: alpha(m.navy, 0.65),
        px: 3,
      }}
    >
      {label}
    </Button>
  );
}

export function MessagingModalPrimaryButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled}
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontWeight: 800,
        fontSize: 13,
        minWidth: 100,
        borderRadius: "10px",
        bgcolor: m.teal,
        px: 3,
        "&:hover": { bgcolor: m.tealDark },
      }}
    >
      {label}
    </Button>
  );
}
