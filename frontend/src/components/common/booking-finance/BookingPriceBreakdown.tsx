"use client";

import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { formatManualEntryDiscountLabel } from "../../sections/finance/manualEntry.data";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import PrepaymentStatusIcon from "../calendar/PrepaymentStatusIcon";
import type { BookingPriceBreakdownRow } from "./bookingFinance.types";
import { financePriceTextSx } from "../finance-documents/financeDocumentUtils";
import {
  formatFinanceEuro,
  prepaidBreakdownLabel,
  remainingBreakdownLabel,
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
  /** Override Remaining label (e.g. ledger "Amount Due"). */
  remainingLabel?: string;
  prepaymentPaid?: boolean;
  /** After-treatment settled → label "Paid (x%)" instead of "Remaining (x%)". */
  remainingPaid?: boolean;
  prepaidAction?: ReactNode;
  extraRows?: readonly BookingPriceBreakdownRow[];
  /** Rows only — no nested card. Use inside a parent booking card. */
  variant?: "card" | "plain";
  /** Hide Remaining when prepayment is not deducted (offline visit payment). */
  showRemaining?: boolean;
};

function FinanceRow({
  label,
  labelIcon,
  value,
  emphasize = false,
  action,
}: {
  label: string;
  labelIcon?: ReactNode;
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
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
        {labelIcon}
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
      </Stack>
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
              ...financePriceTextSx,
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
  remainingLabel,
  prepaymentPaid = false,
  remainingPaid = false,
  prepaidAction,
  extraRows = [],
  variant = "card",
  showRemaining = true,
}: BookingPriceBreakdownProps) {
  const m = useTheme().palette.mollure;
  const isPlain = variant === "plain";
  const round2 = (n: number) =>
    Math.round((n + Number.EPSILON) * 100) / 100;
  // totalPrice must be what the client pays (services + protective fees).
  const grandTotal = round2(totalPrice);
  const showPrepay = prepaidAmount > 0 || prepaidPercent > 0;
  const remaining =
    remainingAmount != null
      ? round2(remainingAmount)
      : round2(grandTotal - prepaidAmount);
  const remainingDiffersFromTotal = round2(remaining) !== round2(grandTotal);
  const renderRemaining = showRemaining && remainingDiffersFromTotal;
  const showStrike =
    originalPrice != null && round2(originalPrice) !== round2(grandTotal);
  const discountHints =
    lineDiscountAmount > 0 ||
    (bookingDiscountAmount > 0 && Boolean(bookingTotalDiscount));
  const extraAfterDivider = extraRows.filter((row) => row.amount !== 0);

  const totalRow = (
    <FinanceRow
      emphasize
      label="Total Price:"
      value={
        showStrike || discountHints ? (
          <Stack alignItems="flex-end" spacing={0.35} sx={{ minWidth: 0 }}>
            {showStrike && originalPrice != null ? (
              <BodyText
                component="span"
                sx={{
                  ...financePriceTextSx,
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
                ...financePriceTextSx,
                m: 0,
                fontSize: 16,
                fontWeight: 950,
                color: alpha(m.navy, 0.88),
              }}
            >
              {formatFinanceEuro(grandTotal)}
            </BodyText>
            {discountHints ? (
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
              </Stack>
            ) : null}
          </Stack>
        ) : (
          formatFinanceEuro(grandTotal)
        )
      }
    />
  );

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
              bgcolor: alpha(m.navy, 0.04),
              px: 2,
              py: 1.6,
            }
      }
    >
      {showPrepay ? (
        <Stack spacing={1} sx={{ mb: 1.25 }}>
          <FinanceRow
            label={prepaidBreakdownLabel(prepaidPercent, prepaymentPaid)}
            labelIcon={
              <PrepaymentStatusIcon
                variant={prepaymentPaid ? "confirmed" : "pending"}
                size={18}
              />
            }
            value={formatFinanceEuro(prepaidAmount)}
            action={prepaidAction}
          />
          {renderRemaining ? (
            <FinanceRow
              label={
                remainingLabel ||
                remainingBreakdownLabel(
                  prepaidPercent,
                  remaining,
                  totalPrice,
                  remainingPaid,
                )
              }
              value={formatFinanceEuro(remaining)}
            />
          ) : null}
        </Stack>
      ) : null}

      {extraAfterDivider.length ||
      lateCancellationFeeAmount > 0 ||
      lateRescheduleFeeAmount > 0 ||
      noShowFeeAmount > 0 ? (
        <Stack spacing={1} sx={{ mb: 1.25 }}>
          {extraAfterDivider.map((row) => (
            <FinanceRow
              key={row.id}
              label={row.label}
              value={formatFinanceEuro(row.amount)}
            />
          ))}
          {lateRescheduleFeeAmount > 0 ? (
            <FinanceRow
              label="Late Reschedule Fee"
              value={formatFinanceEuro(lateRescheduleFeeAmount)}
            />
          ) : null}
          {lateCancellationFeeAmount > 0 ? (
            <FinanceRow
              label="Cancellation Fee"
              value={formatFinanceEuro(lateCancellationFeeAmount)}
            />
          ) : null}
          {noShowFeeAmount > 0 ? (
            <FinanceRow
              label="No-show Fee"
              value={formatFinanceEuro(noShowFeeAmount)}
            />
          ) : null}
        </Stack>
      ) : null}

      {totalRow}
    </Box>
  );
}
