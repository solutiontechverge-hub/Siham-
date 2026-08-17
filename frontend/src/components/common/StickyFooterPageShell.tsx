"use client";

import * as React from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

/** Full-page column layout; pair with stickyFooterAnchorSx on the footer. */
export const stickyFooterPageSx = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
} as const;

/** Flex-grow region between header and footer (or nested page shell). */
export const stickyFooterGrowSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
} as const;

/** Pushes the footer to the bottom when the parent uses stickyFooterPageSx. */
export const stickyFooterAnchorSx = {
  mt: "auto",
} as const;

export type StickyFooterPageShellProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  sx?: SxProps<Theme>;
  mainSx?: SxProps<Theme>;
};

export default function StickyFooterPageShell({
  children,
  footer,
  sx,
  mainSx,
}: StickyFooterPageShellProps) {
  return (
    <Box sx={{ ...stickyFooterPageSx, ...sx }}>
      <Box component="main" sx={{ ...stickyFooterGrowSx, ...mainSx }}>
        {children}
      </Box>
      {footer}
    </Box>
  );
}
