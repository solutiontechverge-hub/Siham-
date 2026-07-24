"use client";

import AppButton from "../AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type BookingRequestAcceptedPanelProps = {
  totalPrice: number;
  prepaymentPercent?: number;
  prepaymentAmount: number;
  remainingAmount: number;
  onOk: () => void;
};

export default function BookingRequestAcceptedPanel({
  totalPrice,
  prepaymentPercent,
  prepaymentAmount,
  remainingAmount,
  onOk,
}: BookingRequestAcceptedPanelProps) {
  const m = useTheme().palette.mollure;
  const prepaidLabel =
    prepaymentPercent && prepaymentPercent > 0
      ? `Prepaid ${prepaymentPercent}%`
      : "Prepaid";

  return (
    <Stack spacing={1.25}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.78) }}
          >
            Total Price:
          </Typography>
          <Typography
            sx={{ fontWeight: 1000, fontSize: 16, color: alpha(m.navy, 0.9) }}
          >
            €{totalPrice}
          </Typography>
        </Box>
        {prepaymentAmount > 0 ? (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1.15 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.65 }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  {prepaidLabel}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  €{prepaymentAmount}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  Remaining
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  €{remainingAmount}
                </Typography>
              </Stack>
            </Box>
          </>
        ) : null}
      </Paper>

      <AppButton
        tone="primary"
        fullWidth
        startIcon={<CheckRoundedIcon />}
        onClick={onOk}
        sx={{
          fontSize: 14,
          py: 1.25,
        }}
      >
        Ok
      </AppButton>
    </Stack>
  );
}
