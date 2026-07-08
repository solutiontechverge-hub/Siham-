"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Euro-in-circle with clock badge — shown when post-treatment payment is due. */
export default function PaymentDueIcon({ size = 22 }: { size?: number }) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.58);
  const badgeSize = Math.max(9, Math.round(size * 0.48));

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="0.9" strokeDasharray="2.5 2.5" opacity={0.55} />
        <circle cx="12" cy="12" r="7.2" stroke={stroke} strokeWidth="1.1" />
        <text
          x="12"
          y="15.2"
          textAnchor="middle"
          fill={stroke}
          fontSize="8.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          €
        </text>
      </svg>
      <Box
        sx={{
          position: "absolute",
          right: -1,
          bottom: -1,
          width: badgeSize,
          height: badgeSize,
          borderRadius: "50%",
          bgcolor: "#fff",
          border: `1px solid ${alpha(stroke, 0.2)}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width={badgeSize - 3} height={badgeSize - 3} viewBox="0 0 10 10" fill="none" aria-hidden>
          <circle cx="5" cy="5" r="3.6" stroke={stroke} strokeWidth="0.9" />
          <path d="M5 3.2v2l1.3.8" stroke={stroke} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Box>
    </Box>
  );
}
