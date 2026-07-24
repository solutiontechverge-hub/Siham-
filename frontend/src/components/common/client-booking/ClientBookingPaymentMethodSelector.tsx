"use client";

import * as React from "react";
import { Box, Paper, Radio, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  CheckoutPaymentMethodId,
  CheckoutPaymentOption,
} from "./checkoutPaymentOptions";

type Props = {
  options: CheckoutPaymentOption[];
  value: CheckoutPaymentMethodId;
  onChange: (value: CheckoutPaymentMethodId) => void;
  disabled?: boolean;
};

export default function ClientBookingPaymentMethodSelector({
  options,
  value,
  onChange,
  disabled = false,
}: Props) {
  const m = useTheme().palette.mollure;

  if (options.length <= 1) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.75,
          py: 1.15,
          bgcolor: alpha(m.navy, 0.02),
          borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
        }}
      >
        <Typography
          sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.78) }}
        >
          Payment method
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            fontSize: 11,
            fontWeight: 700,
            color: alpha(m.navy, 0.48),
          }}
        >
          Options offered by this professional after booking
        </Typography>
      </Box>

      <Stack spacing={0} sx={{ p: 1 }}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Box
              key={option.id}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              sx={{
                width: "100%",
                textAlign: "left",
                border: `1px solid ${selected ? alpha(m.teal, 0.35) : alpha(m.navy, 0.08)}`,
                borderRadius: "10px",
                bgcolor: selected ? alpha(m.teal, 0.06) : "#fff",
                p: 1.25,
                mb: 0.75,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.6 : 1,
                font: "inherit",
                "&:last-of-type": { mb: 0 },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Radio
                  checked={selected}
                  size="small"
                  tabIndex={-1}
                  sx={{
                    p: 0.25,
                    mt: 0.1,
                    color: alpha(m.navy, 0.35),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: 12.5,
                      color: alpha(m.navy, 0.82),
                    }}
                  >
                    {option.label}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: 11,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.5),
                    }}
                  >
                    {option.description}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
