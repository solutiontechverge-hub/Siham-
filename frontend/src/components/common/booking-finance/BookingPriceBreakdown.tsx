"use client";

import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { formatManualEntryDiscountLabel } from "../../sections/finance/manualEntry.data";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import type { BookingPriceBreakdownRow } from "./bookingFinance.types";
import {
  formatFinanceEuro,
  prepaidBreakdownLabel,
} from "./formatBookingFinance";

type BookingPriceBreakdownProps = {
  totalPrice: number;
  originalPrice?: number | null;
  lineDiscountAmount?: number;
  bookingDiscountAmount?: number;
  bookingTotalDiscount?: ManualEntryDiscount | null;
  lateCancellationFeeAmount?: number;
  lateRescheduleFeeAmount?: number;
  noShowFeeAmount?: number;
  prepaidPercent?: number;
  prepaidAmount?: number;
  remainingAmount?: number;
  prepaymentPaid?: boolean;
  prepaidAction?: ReactNode;
  extraRows?: readonly BookingPriceBreakdownRow[];
  /** Rows only — no nested card. Use inside a parent booking card. */
  variant?: "card" | "plain";
  /** Hide Remaining when prepayment is not deducted (offline visit payment). */
  showRemaining?: boolean;
};

function FinanceRow({
  label,
  value,
  emphasize = false,
  action,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
  action?: ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1.5}
    >
      <BodyText
        component="span"
        sx={{
          m: 0,
          fontSize: emphasize ? 16 : 13,
          fontWeight: emphasize ? 950 : 700,
          color: alpha(m.navy, emphasize ? 0.82 : 0.52),
        }}
      >
        {label}
      </BodyText>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ flexShrink: 0 }}
      >
        {action}
        {typeof value === "string" ? (
          <BodyText
            component="span"
            sx={{
              m: 0,
              fontSize: emphasize ? 16 : 13,
              fontWeight: 950,
              color: alpha(m.navy, 0.88),
            }}
          >
            {value}
          </BodyText>
        ) : (
          value
        )}
      </Stack>
    </Stack>
  );
}

export default function BookingPriceBreakdown({
  totalPrice,
  originalPrice = null,
  lineDiscountAmount = 0,
  bookingDiscountAmount = 0,
  bookingTotalDiscount = null,
  lateCancellationFeeAmount = 0,
  lateRescheduleFeeAmount = 0,
  noShowFeeAmount = 0,
  prepaidPercent = 0,
  prepaidAmount = 0,
  remainingAmount,
  prepaymentPaid = false,
  prepaidAction,
  extraRows = [],
  variant = "card",
  showRemaining = true,
}: BookingPriceBreakdownProps) {
  const m = useTheme().palette.mollure;
  const isPlain = variant === "plain";
  const showPrepay = prepaidAmount > 0 || prepaidPercent > 0;
  const remaining =
    remainingAmount ??
    Math.round((totalPrice - prepaidAmount + Number.EPSILON) * 100) / 100;
  const remainingDiffersFromTotal =
    Math.round((remaining + Number.EPSILON) * 100) / 100 !==
    Math.round((totalPrice + Number.EPSILON) * 100) / 100;
  const renderRemaining = showRemaining && remainingDiffersFromTotal;
  const hasAddonBreakdown =
    lineDiscountAmount > 0 ||
    bookingDiscountAmount > 0 ||
    lateCancellationFeeAmount > 0 ||
    lateRescheduleFeeAmount > 0 ||
    noShowFeeAmount > 0;
  const showStrike =
    originalPrice != null &&
    Math.round((originalPrice + Number.EPSILON) * 100) / 100 !==
      Math.round((totalPrice + Number.EPSILON) * 100) / 100;
  const extraAfterDivider = extraRows.filter((row) => row.amount !== 0);

  return (
    <Box
      sx={
        isPlain
          ? {
              mt: 0.5,
              pt: 1.5,
              borderTop: `1px solid ${alpha(m.navy, 0.1)}`,
            }
          : {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: "#fff",
              px: 2,
              py: 1.6,
            }
      }
    >
      <FinanceRow
        emphasize
        label="Total Price:"
        value={
          hasAddonBreakdown || showStrike ? (
            <Stack alignItems="flex-end" spacing={0.35} sx={{ minWidth: 0 }}>
              {showStrike && originalPrice != null ? (
                <BodyText
                  component="span"
                  sx={{
                    m: 0,
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.42),
                    textDecoration: "line-through",
                  }}
                >
                  {formatFinanceEuro(originalPrice)}
                </BodyText>
              ) : null}
              <BodyText
                component="span"
                sx={{
                  m: 0,
                  fontSize: 16,
                  fontWeight: 950,
                  color: alpha(m.navy, 0.88),
                }}
              >
                {formatFinanceEuro(totalPrice)}
              </BodyText>
              <Stack
                direction="row"
                spacing={0.75}
                flexWrap="wrap"
                justifyContent="flex-end"
                useFlexGap
                sx={{ alignItems: "center" }}
              >
                {lineDiscountAmount > 0 ? (
                  <BodyText
                    component="span"
                    sx={{
                      m: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: m.teal,
                    }}
                  >
                    −{formatFinanceEuro(lineDiscountAmount)} Discount
                  </BodyText>
                ) : null}
                {bookingDiscountAmount > 0 && bookingTotalDiscount ? (
                  <BodyText
                    component="span"
                    sx={{
                      m: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: m.teal,
                    }}
                  >
                    {bookingTotalDiscount.type === "percentage"
                      ? `${bookingTotalDiscount.amount}% Discount`
                      : `${formatManualEntryDiscountLabel(bookingTotalDiscount)} Discount`}
                  </BodyText>
                ) : null}
                {lateCancellationFeeAmount > 0 ? (
                  <BodyText
                    component="span"
                    sx={{
                      m: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    +{formatFinanceEuro(lateCancellationFeeAmount)} Cancel fee
                  </BodyText>
                ) : null}
                {lateRescheduleFeeAmount > 0 ? (
                  <BodyText
                    component="span"
                    sx={{
                      m: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    +{formatFinanceEuro(lateRescheduleFeeAmount)} Late fee
                  </BodyText>
                ) : null}
                {noShowFeeAmount > 0 ? (
                  <BodyText
                    component="span"
                    sx={{
                      m: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    +{formatFinanceEuro(noShowFeeAmount)} No-show fee
                  </BodyText>
                ) : null}
              </Stack>
            </Stack>
          ) : (
            formatFinanceEuro(totalPrice)
          )
        }
      />

      {extraAfterDivider.length ? (
        <Stack spacing={1} sx={{ mt: 1.25 }}>
          {extraAfterDivider.map((row) => (
            <FinanceRow
              key={row.id}
              label={row.label}
              value={formatFinanceEuro(row.amount)}
            />
          ))}
        </Stack>
      ) : null}

      {showPrepay ? (
        <Stack spacing={1} sx={{ mt: 1.25 }}>
          <FinanceRow
            label={prepaidBreakdownLabel(prepaidPercent, prepaymentPaid)}
            value={formatFinanceEuro(prepaidAmount)}
            action={prepaidAction}
          />
          {renderRemaining ? (
            <FinanceRow
              label="Remaining"
              value={formatFinanceEuro(remaining)}
            />
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}
