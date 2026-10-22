"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SalesPayableSummary } from "./buildSalesPayableSummary";

function formatEur(amount: number): string {
  const abs = Math.abs(amount);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(2);
  return amount < 0 ? `-€${text}` : `€${text}`;
}

type SalesPayableBarProps = {
  summary: SalesPayableSummary;
};

/** Fixed Sales drawer footer: charge breakdown + final payable. */
export default function SalesPayableBar({ summary }: SalesPayableBarProps) {
  const m = useTheme().palette.mollure;
  const { lines, payable } = summary;

  return (
    <Box
      sx={{
        px: 2.5,
        pt: 1.25,
        pb: 2,
        borderTop: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        boxShadow: "0 -8px 20px rgba(16, 35, 63, 0.06)",
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: alpha(m.navy, 0.45),
          mb: 0.85,
        }}
      >
        Payable summary
      </Typography>
      <Stack spacing={0.45} sx={{ mb: 1.1 }}>
        {lines.map((line) => {
          const isTotal = line.id === "charges-total";
          return (
            <Stack
              key={line.id}
              direction="row"
              justifyContent="space-between"
              spacing={1.5}
              sx={
                isTotal
                  ? {
                      pt: 0.35,
                      mt: 0.15,
                      borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                    }
                  : undefined
              }
            >
              <Typography
                sx={{
                  fontSize: isTotal ? 13 : 12.5,
                  fontWeight: isTotal ? 900 : 700,
                  color: alpha(m.navy, isTotal ? 0.85 : 0.62),
                }}
              >
                {line.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: isTotal ? 13 : 12.5,
                  fontWeight: 800,
                  color:
                    line.tone === "credit"
                      ? alpha(m.navy, 0.5)
                      : alpha(m.navy, isTotal ? 0.9 : 0.82),
                }}
              >
                {formatEur(line.amount)}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          pt: 1,
          borderTop: `1px dashed ${alpha(m.navy, 0.12)}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 900,
            color: m.navy,
          }}
        >
          Amount Due
        </Typography>
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1.1,
            color: payable > 0 ? m.teal : m.navy,
          }}
        >
          {formatEur(payable)}
        </Typography>
      </Stack>
    </Box>
  );
}
