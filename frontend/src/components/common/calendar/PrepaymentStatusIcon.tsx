"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BookingIndicatorIcon from "./BookingIndicatorIcon";

export type PrepaymentStatusIconVariant = "pending" | "confirmed" | "canceled_or_invalid";

export const PREPAYMENT_STATUS_LABELS: Record<PrepaymentStatusIconVariant, string> = {
  pending: "Waiting for prepayment",
  confirmed: "Prepayment confirmed",
  canceled_or_invalid: "Prepayment canceled or invalid",
};

type PrepaymentStatusIconProps = {
  variant: PrepaymentStatusIconVariant;
  size?: number;
};

export default function PrepaymentStatusIcon({ variant, size = 16 }: PrepaymentStatusIconProps) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.58);
  const badgeSize = Math.max(7, Math.round(size * 0.46));

  if (variant === "pending") {
    return <BookingIndicatorIcon variant="waiting_for_prepayment" size={size} />;
  }

  const badgeColor = variant === "confirmed" ? "#22B573" : "#E85D5D";

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0, display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.2" stroke={stroke} strokeWidth="1.1" />
        <text
          x="8"
          y="10.2"
          textAnchor="middle"
          fill={stroke}
          fontSize="6.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          €
        </text>
      </svg>
      <Box
        sx={{
          position: "absolute",
          right: -0.5,
          bottom: -0.5,
          width: badgeSize,
          height: badgeSize,
          borderRadius: "50%",
          bgcolor: badgeColor,
          display: "grid",
          placeItems: "center",
          border: "1px solid #fff",
        }}
      >
        {variant === "confirmed" ? (
          <svg width={badgeSize - 2} height={badgeSize - 2} viewBox="0 0 8 8" fill="none" aria-hidden>
            <path d="M2 4.1 3.5 5.6 6.2 2.8" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width={badgeSize - 2} height={badgeSize - 2} viewBox="0 0 8 8" fill="none" aria-hidden>
            <path d="M2.4 2.4 5.6 5.6M5.6 2.4 2.4 5.6" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        )}
      </Box>
    </Box>
  );
}
