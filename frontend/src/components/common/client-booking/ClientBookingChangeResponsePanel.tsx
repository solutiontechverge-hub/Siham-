"use client";

import AppButton from "../AppButton";
import * as React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  variant: "suggested" | "rejected";
  total: number;
  prepaidAmount: number;
  prepaymentPaid?: boolean;
  onAccept?: () => void;
  onSuggestChange?: () => void;
  onOk?: () => void;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
};

export default function ClientBookingChangeResponsePanel({
  variant,
  total,
  prepaidAmount,
  prepaymentPaid = false,
  onAccept,
  onSuggestChange,
  onOk,
  onViewInvoice,
  onViewReceipt,
}: Props) {
  const m = useTheme().palette.mollure;
  const prepaidDate = new Date().toLocaleDateString("en-US");

  if (variant === "rejected") {
    return (
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {prepaymentPaid ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
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
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: alpha(m.navy, 0.78),
                }}
              >
                Payment Summary
              </Typography>
              <Typography sx={{ fontWeight: 1000, fontSize: 15 }}>
                €{total.toFixed(2)}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 2, py: 1.25 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.75 }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  Prepayment
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                  €{prepaidAmount.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.5),
                  }}
                >
                  • Prepaid – {prepaidDate} – Online Direct
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
                  €{prepaidAmount.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Typography
                  component="button"
                  type="button"
                  onClick={onViewInvoice}
                  disabled={!onViewInvoice}
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: m.teal,
                    border: 0,
                    bgcolor: "transparent",
                    p: 0,
                    cursor: onViewInvoice ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  View Invoice
                </Typography>
                <Typography sx={{ color: alpha(m.navy, 0.25) }}>|</Typography>
                <Typography
                  component="button"
                  type="button"
                  onClick={onViewReceipt}
                  disabled={!onViewReceipt}
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: m.teal,
                    border: 0,
                    bgcolor: "transparent",
                    p: 0,
                    cursor: onViewReceipt ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  View Receipt
                </Typography>
              </Stack>
            </Box>
          </Paper>
        ) : null}
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

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
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
            Payment Summary
          </Typography>
          <Typography sx={{ fontWeight: 1000, fontSize: 15 }}>
            €{total.toFixed(2)}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1.25 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: prepaymentPaid ? 0.75 : 0 }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 12.5,
                color: alpha(m.navy, 0.72),
              }}
            >
              Prepayment
            </Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
              €{prepaidAmount.toFixed(2)}
            </Typography>
          </Stack>
          {prepaymentPaid ? (
            <>
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.5),
                  }}
                >
                  • Prepaid – {prepaidDate} – Online Direct
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
                  €{prepaidAmount.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Typography
                  component="button"
                  type="button"
                  onClick={onViewInvoice}
                  disabled={!onViewInvoice}
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: m.teal,
                    border: 0,
                    bgcolor: "transparent",
                    p: 0,
                    cursor: onViewInvoice ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  View Invoice
                </Typography>
                <Typography sx={{ color: alpha(m.navy, 0.25) }}>|</Typography>
                <Typography
                  component="button"
                  type="button"
                  onClick={onViewReceipt}
                  disabled={!onViewReceipt}
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: m.teal,
                    border: 0,
                    bgcolor: "transparent",
                    p: 0,
                    cursor: onViewReceipt ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  View Receipt
                </Typography>
              </Stack>
            </>
          ) : null}
        </Box>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <AppButton
          fullWidth
          variant="contained"
          disableElevation
          startIcon={<CheckRoundedIcon />}
          onClick={onAccept ?? onOk}
          sx={{
            flex: 1,
            fontSize: 13,
            py: 1.1,
            minHeight: 40,
            bgcolor: m.success,
            color: "#fff",
            "&:hover": { bgcolor: m.successDark, color: "#fff" },
          }}
        >
          Accept
        </AppButton>
        <AppButton
          tone="secondary"
          fullWidth
          onClick={onSuggestChange}
          sx={{
            flex: 1,
            fontSize: 13,
            py: 1.1,
            minHeight: 40,
          }}
        >
          Suggest Change
        </AppButton>
      </Stack>
    </Stack>
  );
}
