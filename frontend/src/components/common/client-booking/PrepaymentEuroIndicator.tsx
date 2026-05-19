"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Compact € indicator for booking header (no clock badge). */
export default function PrepaymentEuroIndicator({ size = 22 }: { size?: number }) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.45);

  return (
    <Box sx={{ width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="1.2" />
        <circle cx="12" cy="12" r="7.5" stroke={stroke} strokeWidth="1" strokeDasharray="2.5 2.5" />
        <text
          x="12"
          y="15.5"
          textAnchor="middle"
          fill={stroke}
          fontSize="10"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          €
        </text>
      </svg>
    </Box>
  );
}
