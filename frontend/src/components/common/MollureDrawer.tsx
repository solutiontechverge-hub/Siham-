"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Divider, Drawer, IconButton, Stack, type DrawerProps, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { SubHeading } from "../ui/typography";

/** Canonical right-panel drawer width — matches View Invoice / finance document drawers. */
export const MOLLURE_DRAWER_WIDTH = { xs: "100%", sm: 560 } as const;

type MollureDrawerProps = Omit<DrawerProps, "children" | "title"> & {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  panelWidth?: number | { xs?: number | string; sm?: number | string };
  /** @deprecated Use panelWidth */
  width?: number | { xs?: number | string; sm?: number | string };
  contentSx?: SxProps<Theme>;
  onBack?: () => void;
  hideDividers?: boolean;
};

export default function MollureDrawer({
  title,
  children,
  footer,
  panelWidth,
  width,
  contentSx,
  onBack,
  hideDividers = false,
  onClose,
  anchor = "right",
  ...props
}: MollureDrawerProps) {
  const resolvedWidth = panelWidth ?? width ?? MOLLURE_DRAWER_WIDTH;
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Drawer anchor={anchor} onClose={onClose} {...props}>
      <Box
        sx={{
          width: resolvedWidth,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            {onBack ? (
              <IconButton
                size="small"
                onClick={onBack}
                aria-label="Back"
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "999px",
                  bgcolor: alpha(m.navy, 0.05),
                  "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                }}
              >
                <ArrowBackRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
              </IconButton>
            ) : null}
            <SubHeading sx={{ fontSize: 16, color: alpha(m.navy, 0.88) }}>{title}</SubHeading>
          </Stack>
          <IconButton
            size="small"
            onClick={() => onClose?.({}, "backdropClick")}
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.05),
              "&:hover": { bgcolor: alpha(m.navy, 0.10) },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
          </IconButton>
        </Stack>
        {hideDividers ? null : <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />}

        <Box sx={{ flex: 1, overflow: "auto", ...contentSx }}>{children}</Box>

        {footer ? (
          <>
            {hideDividers ? null : <Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />}
            <Box sx={{ flexShrink: 0 }}>{footer}</Box>
          </>
        ) : null}
      </Box>
    </Drawer>
  );
}
