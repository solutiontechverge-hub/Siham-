"use client";

import * as React from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureSectionTitleSx } from "../../../theme/mollureHierarchy";
import { formatCompactEuro } from "../booking-finance/formatBookingFinance";

export type BookingPriceSummaryLine = {
  label: string;
  amount: number;
  kind?: "add" | "subtract";
};

export type BookingTotalPriceCardProps = {
  totalPrice: number;
  originalPrice?: number | null;
  discountAmount?: number;
  lines?: readonly BookingPriceSummaryLine[];
  prepaidPercent?: number;
  prepaidAmount?: number;
  remainingAmount?: number;
  prepaidAction?: React.ReactNode;
  /** Drop outer card chrome when nested inside another paper. */
  embedded?: boolean;
  showRemaining?: boolean;
};

function SummaryRow({
  label,
  value,
  muted,
  action,
  emphasize,
}: {
  label: string;
  value: string;
  muted?: boolean;
  action?: React.ReactNode;
  emphasize?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
    >
      <Typography
        sx={
          emphasize
            ? mollureSectionTitleSx(m.navy, { color: m.headingText })
            : {
                fontWeight: 600,
                fontSize: 13,
                color: alpha(m.navy, muted ? 0.55 : 0.68),
              }
        }
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ flexShrink: 0 }}
      >
        {action}
        <Typography
          sx={
            emphasize
              ? mollureSectionTitleSx(m.navy, { color: m.headingText })
              : {
                  fontWeight: 700,
                  fontSize: 13,
                  color: muted ? alpha(m.navy, 0.55) : m.headingText,
                }
          }
        >
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function BookingTotalPriceCard({
  totalPrice,
  originalPrice,
  discountAmount = 0,
  lines = [],
  prepaidPercent,
  prepaidAmount = 0,
  remainingAmount,
  prepaidAction,
  embedded = false,
  showRemaining = true,
}: BookingTotalPriceCardProps) {
  const m = useTheme().palette.mollure;
  const showPrepay = prepaidAmount > 0 || (prepaidPercent ?? 0) > 0;
  const prepaidLabel =
    prepaidPercent && prepaidPercent > 0
      ? `Prepaid ${prepaidPercent}%`
      : "Prepaid";
  const remaining =
    remainingAmount ??
    Math.round((totalPrice - prepaidAmount + Number.EPSILON) * 100) / 100;
  const remainingDiffersFromTotal =
    Math.round((remaining + Number.EPSILON) * 100) / 100 !==
    Math.round((totalPrice + Number.EPSILON) * 100) / 100;
  const renderRemaining = showRemaining && remainingDiffersFromTotal;
  const showStrike = originalPrice != null && originalPrice > totalPrice;
  const visibleLines = lines.filter((line) => line.amount > 0);
  const hasBreakdown = visibleLines.length > 0 || showPrepay;

  return (
    <Box
      sx={{
        borderRadius: embedded ? 0 : "10px",
        border: embedded ? "none" : `1px solid ${m.cardBorder}`,
        bgcolor: embedded ? "transparent" : m.white,
        px: embedded ? 0 : 2,
        py: embedded ? 0 : 1.5,
      }}
    >
      {visibleLines.length ? (
        <Stack spacing={0.7} sx={{ mb: showPrepay ? 1.1 : 0 }}>
          {visibleLines.map((line) => (
            <SummaryRow
              key={line.label}
              label={line.label}
              muted={line.kind === "subtract"}
              value={
                line.kind === "subtract"
                  ? `-${formatCompactEuro(line.amount)}`
                  : formatCompactEuro(line.amount)
              }
            />
          ))}
        </Stack>
      ) : null}

      {showPrepay ? (
        <Stack spacing={0.7}>
          <SummaryRow
            label={prepaidLabel}
            value={formatCompactEuro(prepaidAmount)}
            action={prepaidAction}
            muted
          />
          {renderRemaining ? (
            <SummaryRow
              label="Remaining"
              value={formatCompactEuro(remaining)}
              muted
            />
          ) : null}
        </Stack>
      ) : null}

      {hasBreakdown ? (
        <Divider sx={{ my: 1.15, borderColor: alpha(m.navy, 0.08) }} />
      ) : null}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1.5}
      >
        <Typography
          sx={mollureSectionTitleSx(m.navy, {
            color: m.headingText,
            flexShrink: 0,
          })}
        >
          Total Price
        </Typography>
        <Stack alignItems="flex-end" spacing={0.15} sx={{ minWidth: 0 }}>
          {showStrike ? (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: alpha(m.navy, 0.42),
                textDecoration: "line-through",
                lineHeight: 1.2,
              }}
            >
              {formatCompactEuro(originalPrice)}
            </Typography>
          ) : null}
          <Typography
            sx={mollureSectionTitleSx(m.navy, {
              color: m.headingText,
              lineHeight: 1.2,
            })}
          >
            {formatCompactEuro(totalPrice)}
          </Typography>
          {discountAmount > 0 ? (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: m.teal,
                lineHeight: 1.3,
                textAlign: "right",
              }}
            >
              Discount on total price applied {formatCompactEuro(discountAmount)}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
