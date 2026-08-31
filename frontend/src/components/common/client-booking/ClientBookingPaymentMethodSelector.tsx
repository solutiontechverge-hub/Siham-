"use client";

import * as React from "react";
import { Box, Radio, Stack, Typography } from "@mui/material";
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

  if (!options.length) return null;

  const locked = options.length === 1;

  return (
    <Stack spacing={0.85} sx={{ mt: 2 }}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Box
            key={option.id}
            component="button"
            type="button"
            disabled={disabled || locked}
            onClick={() => onChange(option.id)}
            sx={{
              width: "100%",
              textAlign: "left",
              border: `1px solid ${selected ? m.teal : alpha(m.navy, 0.12)}`,
              borderRadius: "10px",
              bgcolor: selected ? alpha(m.teal, 0.08) : "#fff",
              p: 1.35,
              cursor: disabled || locked ? "default" : "pointer",
              opacity: disabled ? 0.6 : 1,
              font: "inherit",
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
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: m.teal },
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  {option.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: 11.5,
                    fontWeight: 600,
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
  );
}
