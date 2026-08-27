"use client";

import { Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatBookingEur } from "../../../data/bookingLinePricing";

type BookingLineAmountProps = {
  amount: number;
  originalAmount?: number | null;
  discountLabel?: string | null;
  amountFontSize?: number;
};

export default function BookingLineAmount({
  amount,
  originalAmount,
  discountLabel,
  amountFontSize = 13,
}: BookingLineAmountProps) {
  const m = useTheme().palette.mollure;
  const showOriginal =
    typeof originalAmount === "number" &&
    originalAmount > amount &&
    Number.isFinite(originalAmount);

  return (
    <Stack alignItems="flex-end" spacing={0.15} sx={{ flexShrink: 0 }}>
      {showOriginal ? (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            color: alpha(m.navy, 0.38),
            textDecoration: "line-through",
            lineHeight: 1.1,
          }}
        >
          €{formatBookingEur(originalAmount)}
        </Typography>
      ) : null}
      <Typography
        sx={{
          fontSize: amountFontSize,
          fontWeight: 900,
          color: alpha(m.navy, 0.82),
          lineHeight: 1.15,
        }}
      >
        €{formatBookingEur(amount)}
      </Typography>
      {discountLabel ? (
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 800,
            color: m.teal,
            lineHeight: 1.15,
            textAlign: "right",
          }}
        >
          {discountLabel}
        </Typography>
      ) : null}
    </Stack>
  );
}
