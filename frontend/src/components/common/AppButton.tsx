"use client";

import * as React from "react";
import {
  Button,
  CircularProgress,
  type ButtonProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Mollure visual presets — optional; omit for raw MUI Button control. */
export type AppButtonTone =
  "primary" | "secondary" | "danger" | "ghost" | "soft";

/** Height / padding presets paired with `tone` (or alone). */
export type AppButtonPresetSize = "sm" | "md" | "lg";

type AppButtonOwnProps = {
  isLoading?: boolean;
  loadingText?: string;
  /**
   * Brand visual preset. Does not remove any MUI Button capability —
   * `variant`, `color`, `size`, `sx`, `href`, `component`, icons, etc. still work.
   * Caller `sx` always wins over tone styles.
   */
  tone?: AppButtonTone;
  /** Optional height/padding scale (defaults to `md` when `tone` is set). */
  presetSize?: AppButtonPresetSize;
};

/**
 * Full MUI Button surface + Mollure tones.
 * Polymorphic `component` props (e.g. `htmlFor` with `component="label"`, Next `Link`) stay typed.
 */
export type AppButtonProps<C extends React.ElementType = "button"> =
  AppButtonOwnProps &
    Omit<ButtonProps, keyof AppButtonOwnProps | "component"> & {
      component?: C;
    } & Omit<
      React.ComponentPropsWithoutRef<C>,
      keyof ButtonProps | keyof AppButtonOwnProps | "component"
    >;

const PRESET_SIZE_SX: Record<AppButtonPresetSize, object> = {
  sm: { height: 32, px: 1.75, fontSize: 12, minWidth: 72 },
  md: { height: 36, px: 2.25, fontSize: 13, minWidth: 92 },
  lg: { height: 42, px: 3, fontSize: 14, minWidth: 100 },
};

export default function AppButton<C extends React.ElementType = "button">({
  children,
  disabled,
  isLoading = false,
  loadingText,
  tone,
  presetSize,
  variant,
  color,
  disableElevation,
  fullWidth,
  startIcon,
  endIcon,
  sx,
  ...props
}: AppButtonProps<C>) {
  const m = useTheme().palette.mollure;
  const danger = "#E85D5D";

  /** Shared shell — every AppButton gets consistent type/radius even without a tone. */
  const baseSx = {
    textTransform: "none",
    borderRadius: "10px",
    fontWeight: 800,
  } as const;

  const resolvedPreset = presetSize ?? (tone ? ("md" as const) : undefined);

  let toneVariant: ButtonProps["variant"] | undefined;
  let toneColor: ButtonProps["color"] | undefined;
  let toneDisableElevation: boolean | undefined;
  let toneSx: object = {};

  switch (tone) {
    case "primary":
      toneVariant = "contained";
      toneDisableElevation = true;
      toneSx = {
        fontWeight: 900,
        bgcolor: m.teal,
        color: "#fff",
        "&:hover": { bgcolor: m.tealDark, color: "#fff" },
        "&.Mui-disabled": {
          bgcolor: alpha(m.navy, 0.12),
          color: alpha(m.navy, 0.35),
        },
      };
      break;
    case "secondary":
      toneVariant = "outlined";
      toneSx = {
        fontWeight: 800,
        borderColor: alpha(m.navy, 0.14),
        color: alpha(m.navy, 0.72),
        bgcolor: "#fff",
        "&:hover": {
          borderColor: alpha(m.navy, 0.28),
          bgcolor: alpha(m.navy, 0.04),
        },
      };
      break;
    case "danger": {
      const outlinedDanger = variant === "outlined";
      toneVariant = outlinedDanger ? "outlined" : "contained";
      toneDisableElevation = true;
      toneSx = outlinedDanger
        ? {
            fontWeight: 800,
            bgcolor: "#fff",
            color: danger,
            borderColor: alpha(danger, 0.55),
            "&:hover": {
              bgcolor: alpha(danger, 0.06),
              borderColor: danger,
              color: danger,
            },
            "&.Mui-disabled": {
              bgcolor: alpha(m.navy, 0.04),
              color: alpha(m.navy, 0.35),
              borderColor: alpha(m.navy, 0.12),
            },
          }
        : {
            fontWeight: 900,
            bgcolor: danger,
            color: "#fff",
            "&:hover": { bgcolor: "#D14C4C", color: "#fff" },
            "&.Mui-disabled": {
              bgcolor: alpha(m.navy, 0.12),
              color: alpha(m.navy, 0.35),
            },
          };
      break;
    }
    case "ghost":
      toneVariant = "text";
      toneSx = {
        fontWeight: 800,
        color: alpha(m.navy, 0.72),
        "&:hover": { bgcolor: alpha(m.navy, 0.06) },
      };
      break;
    case "soft":
      toneVariant = "contained";
      toneDisableElevation = true;
      toneSx = {
        fontWeight: 800,
        bgcolor: alpha(m.teal, 0.14),
        color: m.tealDark,
        boxShadow: "none",
        "&:hover": { bgcolor: alpha(m.teal, 0.22), boxShadow: "none" },
      };
      break;
    default:
      break;
  }

  const sizeSx = resolvedPreset
    ? {
        ...PRESET_SIZE_SX[resolvedPreset],
        ...(fullWidth ? { minWidth: 0 } : {}),
      }
    : {};

  const spinnerSize =
    resolvedPreset === "sm" ? 14 : resolvedPreset === "lg" ? 20 : 18;

  const mergedSx: SxProps<Theme> = [
    baseSx,
    sizeSx,
    toneSx,
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <Button
      variant={variant ?? toneVariant}
      color={color ?? toneColor}
      disableElevation={disableElevation ?? toneDisableElevation}
      disabled={disabled || isLoading}
      fullWidth={fullWidth}
      startIcon={isLoading ? undefined : startIcon}
      endIcon={isLoading ? undefined : endIcon}
      aria-busy={isLoading || undefined}
      sx={mergedSx}
      {...(props as ButtonProps)}
    >
      {isLoading ? (
        <>
          <CircularProgress
            size={spinnerSize}
            sx={{ mr: 1, color: "inherit" }}
          />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
