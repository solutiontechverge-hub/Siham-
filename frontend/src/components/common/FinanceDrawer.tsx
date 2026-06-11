"use client";

import * as React from "react";
import type { SxProps, Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureDrawer from "./MollureDrawer";

export const FINANCE_DRAWER_WIDTH = { xs: "100%", sm: 500 } as const;
export const FINANCE_DRAWER_WIDE_WIDTH = { xs: "100%", sm: 560 } as const;

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
  /** default: 500px panel | wide: 560px panel */
  size?: "default" | "wide";
  /** When true, skip the muted finance content background */
  plain?: boolean;
  contentSx?: SxProps<Theme>;
};

/** Finance section drawer — wraps MollureDrawer with shared width and content styling. */
export default function FinanceDrawer({
  size = "default",
  plain = false,
  contentSx,
  children,
  ...props
}: FinanceDrawerProps) {
  const m = useTheme().palette.mollure;
  const panelWidth = size === "wide" ? FINANCE_DRAWER_WIDE_WIDTH : FINANCE_DRAWER_WIDTH;
  const mergedContentSx = (
    plain
      ? contentSx
      : contentSx
        ? [financeDrawerContentSx(m), contentSx]
        : financeDrawerContentSx(m)
  ) as SxProps<Theme> | undefined;

  return (
    <MollureDrawer anchor="right" panelWidth={panelWidth} contentSx={mergedContentSx} {...props}>
      {children}
    </MollureDrawer>
  );
}
