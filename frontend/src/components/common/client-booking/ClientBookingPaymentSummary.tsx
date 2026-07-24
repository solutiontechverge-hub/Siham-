"use client";

import * as React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { PaymentSummarySection } from "./buildClientBookingPaymentSummary";

type Props = {
  sections: PaymentSummarySection[];
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
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

export default function ClientBookingPaymentSummary({
  sections,
  onViewInvoice,
  onViewReceipt,
}: Props) {
  const m = useTheme().palette.mollure;

  if (!sections.length) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: 13,
          color: alpha(m.navy, 0.78),
          mb: 1,
          px: 0.25,
        }}
      >
        Payment Summary
      </Typography>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.03),
          px: 1.75,
          py: 1.35,
        }}
      >
        <Stack spacing={2}>
          {sections.map((section) => (
            <Box key={section.title}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 12.5,
                  color: alpha(m.navy, 0.72),
                  mb: 1.1,
                }}
              >
                {section.title}
              </Typography>
              <Stack spacing={1.35}>
                {section.lines.map((line) => (
                  <Box key={line.id}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1.5}
                    >
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.55),
                          lineHeight: 1.45,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        • {line.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 11.5,
                          color: alpha(m.navy, 0.88),
                          flexShrink: 0,
                          minWidth: 72,
                          textAlign: "right",
                        }}
                      >
                        €{line.amount.toFixed(0)}
                      </Typography>
                    </Stack>
                    {line.showInvoice || line.showReceipt ? (
                      <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        sx={{ mt: 0.65, pl: 1.75 }}
                      >
                        {line.showInvoice ? (
                          <SummaryLink
                            label="View Invoice"
                            onClick={onViewInvoice}
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
                            onClick={onViewReceipt}
                            disabled={!onViewReceipt}
                          />
                        ) : null}
                      </Stack>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
