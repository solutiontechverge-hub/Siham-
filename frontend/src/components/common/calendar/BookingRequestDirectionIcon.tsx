"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const PATHS = {
  sent: "M2.2 7.8 7.8 2.2M7.8 2.2H4.4M7.8 2.2V5.6",
  received: "M7.8 2.2 2.2 7.8M2.2 7.8H5.6M2.2 7.8V4.4",
} as const;

export default function BookingRequestDirectionIcon({
  direction,
  size = 10,
}: {
  direction: keyof typeof PATHS;
  size?: number;
}) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.52);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        lineHeight: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden>
        <path
          d={PATHS[direction]}
          stroke={stroke}
          strokeWidth="1.05"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
