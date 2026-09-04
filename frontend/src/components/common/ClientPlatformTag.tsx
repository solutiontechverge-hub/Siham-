"use client";

import * as React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type ClientKind = "individual" | "company";

export type ClientPlatformTagState = "guest" | "mollure" | "business" | null;

export type ClientPlatformTagInput = {
  isMollure?: boolean;
  isGuest?: boolean;
  clientKind?: ClientKind | null;
};

/**
 * Three-state client tag, derived at render time:
 * 1. Mollure platform → logo icon
 * 2. Business (company, not platform) → "BC"
 * 3. Individual offline → no tag
 *
 * Guest is a booking-only overlay, not a client-list type.
 */
export function resolveClientPlatformTag(
  input: ClientPlatformTagInput,
): ClientPlatformTagState {
  if (input.isGuest) return "guest";
  if (input.isMollure) return "mollure";
  if (input.clientKind === "company") return "business";
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
        height: 18,
        minWidth: 22,
        px: 0.65,
        borderRadius: "999px",
        bgcolor: bg,
        color,
        border: `1px solid ${border}`,
        fontSize: 9.5,
        fontWeight: 900,
        lineHeight: 1,
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
  const state = resolveClientPlatformTag({ isMollure, isGuest, clientKind });

  if (!state) return null;

  const mark =
    state === "mollure" ? (
      <MollureLogoMark size={16} />
    ) : state === "business" ? (
      <Box component="span" aria-label="Business Client">
        <TagPill label="BC" tone="teal" />
      </Box>
    ) : (
      <TagPill label="Guest" />
    );

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
      {mark}
    </Box>
  );
}
