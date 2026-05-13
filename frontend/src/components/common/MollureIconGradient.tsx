"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";

/**
 * SVG linear gradient from `palette.mollure.iconGradientStart` → `iconGradientEnd`.
 * Render `defs` once per icon (or per card); use `fill` on MUI SvgIcon `sx`.
 */
export function useMollureIconGradient() {
  const theme = useTheme();
  const reactId = React.useId();
  const id = `mollure-ig-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const start = theme.palette.mollure.iconGradientStart;
  const end = theme.palette.mollure.iconGradientEnd;
  const fill = `url(#${id})`;

  const defs = (
    <svg
      width={1}
      height={1}
      aria-hidden
      style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={start} />
          <stop offset="100%" stopColor={end} />
        </linearGradient>
      </defs>
    </svg>
  );

  return { fill, defs, id };
}

/** Sx for MUI SvgIcon / icons-material: paint vector shapes with the gradient `fill` (`url(#…)`). */
export function mollureGradientIconSx(fill: string) {
  return {
    fontSize: 26,
    color: "transparent",
    fill,
    "& path, & circle, & rect, & line, & polyline, & polygon": {
      fill,
    },
  } as const;
}
