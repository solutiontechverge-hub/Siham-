"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type ClientKind = "individual" | "company";

export type ClientPlatformTagState = "guest" | "mollure" | "ic" | "cc" | null;

export type ClientPlatformTagInput = {
  isMollure?: boolean;
  isGuest?: boolean;
  clientKind?: ClientKind | null;
};

/**
 * Client tags:
 * - Guest overlay → "Guest"
 * - Individual → "IC"
 * - Company → "CC"
 * - Mollure logo only when there is no IC/CC type tag
 */
export function resolveClientPlatformTag(
  input: ClientPlatformTagInput,
): ClientPlatformTagState {
  if (input.isGuest) return "guest";
  if (input.clientKind === "company") return "cc";
  if (input.clientKind === "individual") return "ic";
  if (input.isMollure) return "mollure";
  return null;
}

export function MollureLogoMark({
  size = 16,
}: {
  size?: number;
}) {
  const tokens = useTheme().palette.mollure;
  const height = Math.round(size * 0.8);

  return (
    <Box
      component="span"
      aria-label="Mollure platform client"
      sx={{
        display: "inline-flex",
        width: size,
        height,
        position: "relative",
        flexShrink: 0,
        "& span": {
          position: "absolute",
          display: "block",
          borderRadius: "999px",
          bgcolor: tokens.logoPrimary,
        },
        "& span:nth-of-type(1)": {
          inset: "4% 36% 4% 36%",
          transform: "rotate(50deg)",
        },
        "& span:nth-of-type(2)": {
          inset: "4% 36% 4% 36%",
          transform: "rotate(-50deg)",
        },
        "& span:nth-of-type(3)": {
          inset: "33% 0 33% 0",
          bgcolor: tokens.logoAccent,
        },
        "& span:nth-of-type(4)": {
          inset: "0 20% 0 20%",
          transform: "rotate(90deg)",
          bgcolor: tokens.logoSecondary,
        },
      }}
    >
      <span />
      <span />
      <span />
      <span />
    </Box>
  );
}

function TagPill({
  label,
  tone = "navy",
}: {
  label: string;
  tone?: "navy" | "teal";
}) {
  const m = useTheme().palette.mollure;
  const color = tone === "teal" ? m.teal : alpha(m.navy, 0.72);
  const bg =
    tone === "teal" ? alpha(m.teal, 0.16) : alpha(m.navy, 0.06);
  const border =
    tone === "teal" ? alpha(m.teal, 0.4) : alpha(m.navy, 0.14);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        height: 20,
        minWidth: 28,
        px: 0.85,
        borderRadius: "999px",
        bgcolor: bg,
        color,
        border: `1px solid ${border}`,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.04em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}

export default function ClientPlatformTag({
  isMollure,
  isGuest,
  clientKind,
}: ClientPlatformTagInput) {
  if (isGuest) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          flexShrink: 0,
          lineHeight: 0,
        }}
      >
        <TagPill label="Guest" />
      </Box>
    );
  }

  const typeLabel =
    clientKind === "company"
      ? "CC"
      : clientKind === "individual"
        ? "IC"
        : null;

  if (!isMollure && !typeLabel) return null;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      {typeLabel ? null : isMollure ? <MollureLogoMark size={16} /> : null}
      {typeLabel ? (
        <Box
          component="span"
          aria-label={
            typeLabel === "CC" ? "Company Client" : "Individual Client"
          }
        >
          <TagPill label={typeLabel} tone="teal" />
        </Box>
      ) : null}
    </Box>
  );
}
