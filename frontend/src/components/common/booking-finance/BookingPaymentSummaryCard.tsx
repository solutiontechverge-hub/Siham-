"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import { financePriceTextSx } from "../finance-documents/financeDocumentUtils";
import type { BookingPaymentSummarySection } from "./bookingFinance.types";
import { formatFinanceEuro } from "./formatBookingFinance";

type BookingPaymentSummaryCardProps = {
  sections: readonly BookingPaymentSummarySection[];
  onViewInvoice?: (lineId: string) => void;
  onViewReceipt?: (lineId: string) => void;
  onPayNow?: (lineId: string) => void;
};

function SummaryLink({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Typography
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      sx={{
        fontSize: 11,
        fontWeight: 800,
        color: m.teal,
        border: 0,
        bgcolor: "transparent",
        p: 0,
        cursor: onClick && !disabled ? "pointer" : "default",
        fontFamily: "inherit",
        opacity: onClick && !disabled ? 1 : 0.5,
        textDecoration: "underline",
        textUnderlineOffset: 2,
      }}
    >
      {label}
    </Typography>
  );
}

export default function BookingPaymentSummaryCard({
  sections,
  onViewInvoice,
  onViewReceipt,
  onPayNow,
}: BookingPaymentSummaryCardProps) {
  const m = useTheme().palette.mollure;
  if (!sections.length) return null;

  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 14,
          color: alpha(m.navy, 0.82),
          lineHeight: 1,
          mb: 1,
          px: 1.6,
        }}
      >
        Payment Summary
      </Typography>

      <Stack spacing={1.15}>
        {sections.map((section) => (
          <Paper
            key={section.id}
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: section.variant === "fee" ? alpha(m.navy, 0.03) : "#fff",
              px: 1.6,
              py: 1.35,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1.5}
              sx={{ mb: section.lines.length ? 0.85 : 0 }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 13,
                  color: alpha(m.navy, 0.78),
                  lineHeight: 1,
                }}
              >
                {section.title}
              </Typography>
              {section.amount != null ? (
                <Typography
                  sx={{
                    ...financePriceTextSx,
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.88),
                    lineHeight: 1,
                  }}
                >
                  {formatFinanceEuro(section.amount)}
                </Typography>
              ) : null}
            </Stack>
            <Stack spacing={1.1}>
              {section.lines.map((line) => {
                const isRefund = line.tone === "refund";
                const amountColor = isRefund ? "#C67A00" : alpha(m.navy, 0.88);
                return (
                  <Box key={line.id}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1.5}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isRefund ? "#C67A00" : alpha(m.navy, 0.5),
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        • {line.label}
                      </Typography>
                      <Typography
                        sx={mollureLabelSx(m.navy, {
                          ...financePriceTextSx,
                          fontWeight: 900,
                          color: amountColor,
                          flexShrink: 0,
                          lineHeight: 1,
                        })}
                      >
                        {formatFinanceEuro(line.amount)}
                      </Typography>
                    </Stack>
                    {line.showInvoice || line.showReceipt || line.showPayNow ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.55, pl: 1.35 }}
                      >
                        {line.showInvoice ? (
                          <SummaryLink
                            label="View Invoice"
                            onClick={() => onViewInvoice?.(line.id)}
                            disabled={!onViewInvoice}
                          />
                        ) : null}
                        {line.showInvoice && line.showReceipt ? (
                          <Typography
                            sx={{ color: alpha(m.navy, 0.25), fontSize: 11 }}
                          >
                            |
                          </Typography>
                        ) : null}
                        {line.showReceipt ? (
                          <SummaryLink
                            label="View Receipt"
                            onClick={() => onViewReceipt?.(line.id)}
                            disabled={!onViewReceipt}
                          />
                        ) : null}
                        {line.showPayNow ? (
                          <>
                            {line.showInvoice || line.showReceipt ? (
                              <Typography
                                sx={{
                                  color: alpha(m.navy, 0.25),
                                  fontSize: 11,
                                }}
                              >
                                |
                              </Typography>
                            ) : null}
                            <SummaryLink
                              label="Pay Now"
                              onClick={() => onPayNow?.(line.id)}
                              disabled={!onPayNow}
                            />
                          </>
                        ) : null}
                      </Stack>
                    ) : null}
                    {line.note ? (
                      <Typography
                        sx={{
                          mt: 0.55,
                          pl: 1.35,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.48),
                          lineHeight: 1.35,
                        }}
                      >
                        {line.note}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
