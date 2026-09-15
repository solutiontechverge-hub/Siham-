"use client";

import type { ReactNode } from "react";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  MOLLURE_UI,
  mollureConfirmBodySx,
} from "../../theme/mollureHierarchy";

type IconFrame = "none" | "circle" | "rounded";
type Layout = "center" | "inline";

/** Shared confirm body — centered (booking/messaging) or inline amber row (admin). */
export default function ModalConfirmBody({
  body,
  showWarning = false,
  layout = "center",
  icon,
  iconFrame = "none",
  iconFrameSize = 56,
  iconFrameBg,
  bodyOpacity = MOLLURE_UI.confirm.opacity,
  iconSize = layout === "inline" ? 22 : 52,
  iconMb = layout === "inline" ? 0 : 1.5,
  iconColor = layout === "inline" ? "#DC6803" : "#E85D5D",
  bodyMaxWidth,
  py = layout === "inline" ? 0 : 2.5,
  px = 0,
  bodySx,
}: {
  body: ReactNode;
  showWarning?: boolean;
  layout?: Layout;
  /** Overrides default warning icon when `showWarning` is true. */
  icon?: ReactNode;
  iconFrame?: IconFrame;
  iconFrameSize?: number;
  iconFrameBg?: string;
  bodyOpacity?: number;
  iconSize?: number;
  iconMb?: number;
  iconColor?: string;
  bodyMaxWidth?: number | string;
  py?: number;
  px?: number;
  bodySx?: Record<string, unknown>;
}) {
  const m = useTheme().palette.mollure;
  const resolvedIcon =
    icon ??
    (showWarning ? (
      <WarningAmberRoundedIcon
        sx={{
          fontSize: iconSize,
          color: iconColor,
          ...(layout === "inline" ? { mt: 0.25 } : null),
        }}
      />
    ) : null);

  if (layout === "inline") {
    return (
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="flex-start"
        sx={{ py, px }}
      >
        {resolvedIcon}
        <Box sx={{ minWidth: 0, flex: 1, textAlign: "left", ...bodySx }}>
          {body}
        </Box>
      </Stack>
    );
  }

  const framedIcon =
    resolvedIcon && iconFrame !== "none" ? (
      <Box
        sx={{
          width: iconFrameSize,
          height: iconFrameSize,
          borderRadius: iconFrame === "circle" ? "50%" : "14px",
          mx: "auto",
          mb: iconMb,
          bgcolor: iconFrameBg ?? alpha(iconColor, 0.12),
          display: "grid",
          placeItems: "center",
        }}
      >
        {resolvedIcon}
      </Box>
    ) : resolvedIcon ? (
      <Box sx={{ mb: iconMb, display: "flex", justifyContent: "center" }}>
        {resolvedIcon}
      </Box>
    ) : null;

  return (
    <Box sx={{ py, px, textAlign: "center" }}>
      {framedIcon}
      <Typography
        sx={{
          ...mollureConfirmBodySx(m.navy, bodyOpacity),
          ...(bodyMaxWidth ? { maxWidth: bodyMaxWidth, mx: "auto" } : null),
          ...bodySx,
        }}
      >
        {body}
      </Typography>
    </Box>
  );
}
