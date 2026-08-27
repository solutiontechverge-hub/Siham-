"use client";

import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { formatBookingEur } from "../../../data/bookingLinePricing";
import { formatManualEntryDiscountLabel } from "../../sections/finance/manualEntry.data";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";

type BookingDrawerTotalPriceCardProps = {
  payableTotal: number;
  actualAmount: number;
  lineDiscountAmount?: number;
  bookingDiscountAmount?: number;
  bookingTotalDiscount?: ManualEntryDiscount | null;
  lateCancellationFeeAmount?: number;
  lateRescheduleFeeAmount?: number;
  prepaidApplied?: number;
};

export default function BookingDrawerTotalPriceCard({
  payableTotal,
  actualAmount,
  lineDiscountAmount = 0,
  bookingDiscountAmount = 0,
  bookingTotalDiscount = null,
  lateCancellationFeeAmount = 0,
  lateRescheduleFeeAmount = 0,
  prepaidApplied = 0,
}: BookingDrawerTotalPriceCardProps) {
  const m = useTheme().palette.mollure;
  const hasBreakdown =
    lineDiscountAmount > 0 ||
    bookingDiscountAmount > 0 ||
    lateCancellationFeeAmount > 0 ||
    lateRescheduleFeeAmount > 0 ||
    prepaidApplied > 0;
  const showStrike =
    hasBreakdown && round2(actualAmount) !== round2(payableTotal);

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.16)}`,
        bgcolor: "#fff",
        px: 2,
        py: 1.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <BodyText
        sx={{
          fontSize: 16,
          fontWeight: 950,
          color: alpha(m.navy, 0.78),
          flexShrink: 0,
        }}
      >
        Total Price:
      </BodyText>
      {hasBreakdown ? (
        <Stack alignItems="flex-end" spacing={0.35} sx={{ minWidth: 0 }}>
          {showStrike ? (
            <BodyText
              sx={{
                fontSize: 14,
                fontWeight: 800,
                color: alpha(m.navy, 0.42),
                textDecoration: "line-through",
                lineHeight: 1.2,
              }}
            >
              {formatBookingEur(actualAmount)}€
            </BodyText>
          ) : null}
          <BodyText
            sx={{
              fontSize: 18,
              fontWeight: 950,
              color: alpha(m.navy, 0.9),
              lineHeight: 1.2,
            }}
          >
            {formatBookingEur(payableTotal)}€
          </BodyText>
          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            justifyContent="flex-end"
            useFlexGap
          >
            {lineDiscountAmount > 0 ? (
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: m.teal,
                  lineHeight: 1.2,
                }}
              >
                −€{formatBookingEur(lineDiscountAmount)} Discount
              </BodyText>
            ) : null}
            {bookingDiscountAmount > 0 && bookingTotalDiscount ? (
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: m.teal,
                  lineHeight: 1.2,
                }}
              >
                {bookingTotalDiscount.type === "percentage"
                  ? `${bookingTotalDiscount.amount}% Discount`
                  : `${formatManualEntryDiscountLabel(bookingTotalDiscount)} Discount`}
              </BodyText>
            ) : null}
            {lateCancellationFeeAmount > 0 ? (
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.55),
                  lineHeight: 1.2,
                }}
              >
                +€{formatBookingEur(lateCancellationFeeAmount)} Cancel fee
              </BodyText>
            ) : null}
            {lateRescheduleFeeAmount > 0 ? (
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.55),
                  lineHeight: 1.2,
                }}
              >
                +€{formatBookingEur(lateRescheduleFeeAmount)} Late fee
              </BodyText>
            ) : null}
            {prepaidApplied > 0 ? (
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: m.teal,
                  lineHeight: 1.2,
                }}
              >
                −€{formatBookingEur(prepaidApplied)} Prepaid
              </BodyText>
            ) : null}
          </Stack>
        </Stack>
      ) : (
        <BodyText
          sx={{
            fontSize: 18,
            fontWeight: 950,
            color: alpha(m.navy, 0.9),
          }}
        >
          €{formatBookingEur(payableTotal)}
        </BodyText>
      )}
    </Box>
  );
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
