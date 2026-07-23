"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Drawer, IconButton, Stack, type DrawerProps, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText, SubHeading } from "../ui/typography";

/** Canonical right-panel drawer width — shared across all app drawers. */
export const MOLLURE_DRAWER_WIDTH = { xs: "100%", sm: 560 } as const;

const DRAWER_LEFT_RADIUS = 16;

function mutedContentSx(navy: string): SxProps<Theme> {
  return {
    bgcolor: alpha(navy, 0.03),
    px: 2.25,
    py: 2,
  };
}

type AppDrawerProps = Omit<DrawerProps, "children" | "title"> & {
  /** Required drawer title shown in the primary header bar. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  panelWidth?: number | { xs?: number | string; sm?: number | string };
  contentSx?: SxProps<Theme>;
  onBack?: () => void;
  /** Rendered in the header, before the close button. */
  headerActions?: React.ReactNode;
  /** Soft muted body background (finance-style). */
  contentVariant?: "default" | "muted";
};

/** Single shared Mollure panel drawer — soft teal header, scroll body, optional footer. */
export default function AppDrawer({
  title,
  subtitle,
  children,
  footer,
  panelWidth,
  contentSx,
  onBack,
  headerActions,
  contentVariant = "default",
  onClose,
  anchor = "right",
  PaperProps,
  ...props
}: AppDrawerProps) {
  const resolvedWidth = panelWidth ?? MOLLURE_DRAWER_WIDTH;
  const theme = useTheme();
  const m = theme.palette.mollure;
  const useMuted = contentVariant === "muted";
  const paperSx = PaperProps?.sx;

  const mergedContentSx = (
    useMuted ? (contentSx ? [mutedContentSx(m.navy), contentSx] : mutedContentSx(m.navy)) : contentSx
  ) as SxProps<Theme> | undefined;

  const headerIconBtnSx = {
    width: 30,
    height: 30,
    borderRadius: "999px",
    color: alpha(m.navy, 0.55),
    bgcolor: alpha(m.navy, 0.06),
    "&:hover": { bgcolor: alpha(m.navy, 0.12) },
  } as const;

  return (
    <Drawer
      anchor={anchor}
      onClose={onClose}
      {...props}
      PaperProps={{
        ...PaperProps,
        sx: [
          {
            width: resolvedWidth,
            maxWidth: "100vw",
            overflow: "hidden",
            borderTopLeftRadius: DRAWER_LEFT_RADIUS,
            borderBottomLeftRadius: DRAWER_LEFT_RADIUS,
            boxShadow: "0 22px 70px rgba(16, 24, 40, 0.22)",
          },
          ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : []),
        ],
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
        }}
      >
        <Stack
          direction="row"
          alignItems={subtitle ? "flex-start" : "center"}
          justifyContent="space-between"
          sx={{
            px: 2.5,
            py: 1.75,
            flexShrink: 0,
            bgcolor: alpha(m.teal, 0.12),
            color: m.navy,
          }}
        >
          <Stack direction="row" alignItems={subtitle ? "flex-start" : "center"} spacing={1} sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            {onBack ? (
              <IconButton size="small" onClick={onBack} aria-label="Back" sx={{ ...headerIconBtnSx, mt: subtitle ? 0.15 : 0 }}>
                <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              <SubHeading sx={{ fontSize: subtitle ? 18 : 16, color: alpha(m.navy, 0.9), fontWeight: 800 }}>{title}</SubHeading>
              {subtitle ? (
                <BodyText sx={{ mt: 0.4, color: alpha(m.navy, 0.62), fontSize: 13 }}>{subtitle}</BodyText>
              ) : null}
            </Box>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              flexShrink: 0,
              "& .MuiButton-root": {
                color: alpha(m.navy, 0.75),
                fontWeight: 800,
              },
              "& .MuiIconButton-root": headerIconBtnSx,
            }}
          >
            {headerActions}
            <IconButton size="small" onClick={() => onClose?.({}, "backdropClick")} aria-label="Close drawer" sx={headerIconBtnSx}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={[
            { flex: 1, overflowY: "auto", overflowX: "hidden" },
            ...(Array.isArray(mergedContentSx) ? mergedContentSx : mergedContentSx ? [mergedContentSx] : []),
          ]}
        >
          {children}
        </Box>

        {footer ? <Box sx={{ flexShrink: 0 }}>{footer}</Box> : null}
      </Box>
    </Drawer>
  );
}
