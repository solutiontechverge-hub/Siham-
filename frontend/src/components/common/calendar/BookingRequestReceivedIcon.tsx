"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export const BOOKING_REQUEST_RECEIVED_LABEL = "Booking request received";

type BookingRequestReceivedIconProps = {
  size?: number;
};

/** Diagonal down-left arrow — booking request received from the other party. */
export default function BookingRequestReceivedIcon({ size = 10 }: BookingRequestReceivedIconProps) {
  const stroke = alpha(useTheme().palette.mollure.navy, 0.52);

  return (
    <Box sx={{ width: size, height: size, flexShrink: 0, display: "grid", placeItems: "center", lineHeight: 0 }}>
      <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden>
        <path
          d="M7.8 2.2 2.2 7.8M2.2 7.8H5.6M2.2 7.8V4.4"
          stroke={stroke}
          strokeWidth="1.05"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
