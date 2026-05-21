"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Euro + clock badge — prepayment pending (finance design). */
export default function PrepaymentPayNowIcon({ size = 28 }: { size?: number }) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.55);
  const badgeSize = Math.round(size * 0.46);

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="13" stroke={stroke} strokeWidth="1.5" />
        <circle cx="16" cy="16" r="10" stroke={stroke} strokeWidth="1.2" strokeDasharray="3 3" />
        <text
          x="16"
          y="20"
          textAnchor="middle"
          fill={stroke}
          fontSize="13"
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
          border: `1px solid ${alpha(stroke, 0.35)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={badgeSize - 4} height={badgeSize - 4} viewBox="0 0 12 12" fill="none" aria-hidden>
          <circle cx="6" cy="6" r="4.5" stroke={stroke} strokeWidth="1" />
          <path d="M6 4v2.2l1.4 0.8" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
        </svg>
      </Box>
    </Box>
  );
}
