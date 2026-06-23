"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type BookingIndicatorVariant = "suggestion_for_change" | "waiting_for_prepayment" | "overdue_response";

export const BOOKING_INDICATOR_LABELS: Record<BookingIndicatorVariant, string> = {
  suggestion_for_change: "Suggestion for change",
  waiting_for_prepayment: "Waiting for prepayment",
  overdue_response: "Overdue response",
};

type BookingIndicatorIconProps = {
  variant: BookingIndicatorVariant;
  size?: number;
};

export default function BookingIndicatorIcon({ variant, size = 16 }: BookingIndicatorIconProps) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.58);

  if (variant === "suggestion_for_change") {
    return (
      <Box sx={{ width: size, height: size, flexShrink: 0, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="4.8" y="2.4" width="8.2" height="11.2" rx="1.1" stroke={stroke} strokeWidth="1.05" />
          <path d="M3.2 4.6h1.2M3.2 7h1.2M3.2 9.4h1.2" stroke={stroke} strokeWidth="1.05" strokeLinecap="round" />
          <path
            d="M8.4 6.2a2.1 2.1 0 1 1 0 3.6"
            stroke={stroke}
            strokeWidth="0.95"
            strokeLinecap="round"
          />
          <path
            d="M9.8 5.1 10.8 5.4 10.5 6.4"
            stroke={stroke}
            strokeWidth="0.95"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 9.1a2.1 2.1 0 1 1 0-3.6"
            stroke={stroke}
            strokeWidth="0.95"
            strokeLinecap="round"
          />
          <path
            d="M5.6 10.2 4.6 9.9 4.9 8.9"
            stroke={stroke}
            strokeWidth="0.95"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
    );
  }

  if (variant === "waiting_for_prepayment") {
    return (
      <Box sx={{ width: size, height: size, flexShrink: 0, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M5.2 2.8h5.6l1.4 2.6H3.8l1.4-2.6Z"
            stroke={stroke}
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
          <path d="M4.2 5.4h7.6v1.1c0 .8-.5 1.5-1.2 1.9l-2.6 1.5-2.6-1.5c-.7-.4-1.2-1.1-1.2-1.9V5.4Z" stroke={stroke} strokeWidth="1.05" />
          <path
            d="M5.2 13.2h5.6l1.4-2.6H3.8l1.4 2.6Z"
            stroke={stroke}
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
          <path d="M7.3 8.8v2.1" stroke={stroke} strokeWidth="0.95" strokeLinecap="round" />
          <path d="M6.2 7.8h2.2" stroke={stroke} strokeWidth="0.95" strokeLinecap="round" />
        </svg>
      </Box>
    );
  }

  const badgeSize = Math.max(7, Math.round(size * 0.5));

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0, display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8.2" r="5.4" stroke={stroke} strokeWidth="1.05" />
        <path d="M8 4.8v3.4l2.1 1.2" stroke={stroke} strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.1 2.4h.9M8.9 2.4h.9" stroke={stroke} strokeWidth="1.05" strokeLinecap="round" />
      </svg>
      <Box
        sx={{
          position: "absolute",
          right: -0.5,
          bottom: -0.5,
          width: badgeSize,
          height: badgeSize,
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width={badgeSize} height={badgeSize} viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M5 1.2 8.8 8H1.2L5 1.2Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0.4" />
          <path d="M5 3.4v2.1" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="5" cy="7.1" r="0.45" fill="#fff" />
        </svg>
      </Box>
    </Box>
  );
}
