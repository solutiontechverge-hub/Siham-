"use client";

import * as React from "react";
import type { SxProps, Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureDrawer, { MOLLURE_DRAWER_WIDTH } from "./MollureDrawer";

/** @deprecated Use MOLLURE_DRAWER_WIDTH — all finance drawers share one width. */
export const FINANCE_DRAWER_WIDTH = MOLLURE_DRAWER_WIDTH;
/** @deprecated Use MOLLURE_DRAWER_WIDTH — all finance drawers share one width. */
export const FINANCE_DRAWER_WIDE_WIDTH = MOLLURE_DRAWER_WIDTH;

export function financeDrawerContentSx(m: { navy: string }): SxProps<Theme> {
  return {
    bgcolor: alpha(m.navy, 0.03),
    px: 2.25,
    py: 2,
  };
}

type FinanceDrawerProps = Omit<
  React.ComponentProps<typeof MollureDrawer>,
  "anchor" | "panelWidth" | "width" | "contentSx"
> & {
  /** Kept for API compatibility — both sizes use the shared site drawer width. */
  size?: "default" | "wide";
  /** When true, skip the muted finance content background */
  plain?: boolean;
  contentSx?: SxProps<Theme>;
};

/** Finance section drawer — wraps MollureDrawer with shared width and content styling. */
export default function FinanceDrawer({
  size: _size = "default",
  plain = false,
  contentSx,
  children,
  ...props
}: FinanceDrawerProps) {
  const m = useTheme().palette.mollure;
  const mergedContentSx = (
    plain
      ? contentSx
      : contentSx
        ? [financeDrawerContentSx(m), contentSx]
        : financeDrawerContentSx(m)
  ) as SxProps<Theme> | undefined;

  return (
    <MollureDrawer anchor="right" panelWidth={MOLLURE_DRAWER_WIDTH} contentSx={mergedContentSx} {...props}>
      {children}
    </MollureDrawer>
  );
}
