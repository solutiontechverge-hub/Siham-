"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export const BOOKING_REQUEST_SENT_LABEL = "Booking request sent";

type BookingRequestSentIconProps = {
  size?: number;
};

/** Diagonal up-right arrow — booking request sent to client. */
export default function BookingRequestSentIcon({
  size = 10,
}: BookingRequestSentIconProps) {
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
      <svg
        width={size}
        height={size}
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden
      >
        <path
          d="M2.2 7.8 7.8 2.2M7.8 2.2H4.4M7.8 2.2V5.6"
          stroke={stroke}
          strokeWidth="1.05"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
