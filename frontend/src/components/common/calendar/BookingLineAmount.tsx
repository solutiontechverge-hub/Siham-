"use client";

import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatBookingEur } from "../../../data/bookingLinePricing";
import { financePriceTextSx } from "../finance-documents/financeDocumentUtils";
import { BodyText } from "../../ui/typography";

type BookingLineAmountProps = {
  amount: number;
  originalAmount?: number | null;
  discountLabel?: string | null;
};

export default function BookingLineAmount({
  amount,
  originalAmount,
  discountLabel,
}: BookingLineAmountProps) {
  const m = useTheme().palette.mollure;
  const showOriginal =
    typeof originalAmount === "number" &&
    originalAmount > amount &&
    Number.isFinite(originalAmount);

  return (
    <Stack alignItems="flex-end" spacing={0.15} sx={{ flexShrink: 0 }}>
      {showOriginal ? (
        <BodyText
          sx={{
            ...financePriceTextSx,
            m: 0,
            fontSize: 11,
            fontWeight: 800,
            color: alpha(m.navy, 0.38),
            textDecoration: "line-through",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          €{formatBookingEur(originalAmount)}
        </BodyText>
      ) : null}
      <BodyText
        sx={{
          ...financePriceTextSx,
          m: 0,
          fontSize: 13,
          fontWeight: 900,
          color: alpha(m.navy, 0.82),
          lineHeight: 1.15,
          whiteSpace: "nowrap",
        }}
      >
        €{formatBookingEur(amount)}
      </BodyText>
      {discountLabel ? (
        <BodyText
          sx={{
            m: 0,
            fontSize: 10.5,
            fontWeight: 800,
            color: m.teal,
            lineHeight: 1.15,
            textAlign: "right",
          }}
        >
          {discountLabel}
        </BodyText>
      ) : null}
    </Stack>
  );
}
