"use client";

import * as React from "react";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import { TaxCompliantInvoiceIcon } from "../../../../images";
import {
  Bullet,
  MARKETING_CARD_SHADOW,
  MARKETING_CARD_SHADOW_INNER,
} from "./professionalFeaturesCardsShared";

export function PaymentsInvoicingFinancialControlCard() {
  const tokens = useTheme().palette.mollure;

  const invoiceIconBg = tokens.statusGreyFg; // matches tax-compliant icon slate

  const Mini = ({
    icon,
    title,
    filledIcon = false,
  }: {
    icon: React.ReactNode;
    title: string;
    filledIcon?: boolean;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha(tokens.navy, 0.08)}`,
        bgcolor: "#fff",
        boxShadow: MARKETING_CARD_SHADOW_INNER,
        px: 2.1,
        py: 2,
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.2,
          bgcolor: filledIcon ? "transparent" : invoiceIconBg,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          flexShrink: 0,
          "& img": filledIcon
            ? {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }
            : undefined,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 800,
          color: alpha(tokens.navy, 0.72),
          lineHeight: 1.25,
        }}
      >
        {title}
      </Typography>
    </Paper>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: MARKETING_CARD_SHADOW,
      }}
    >
      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: MARKETING_CARD_SHADOW_INNER,
          }}
        >
          <Typography
            sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}
          >
            Payments, Invoicing &amp; Financial Control
          </Typography>
        </Box>

        <Typography
          sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}
        >
          Stay In Control Of Your Finances With Stripe-Powered Payments.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet color={tokens.teal}>
            Clear overview of all transactions (online and offline)
          </Bullet>
          <Bullet color={tokens.teal}>Stripe-powered online payments with direct payouts</Bullet>
          <Bullet color={tokens.teal}>
            Access to your connected Stripe dashboard for online payment details
          </Bullet>
          <Bullet color={tokens.teal}>
            Control which post-booking payment methods are available at checkout
          </Bullet>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 2.25 }}>
          <Grid item xs={12} md={4}>
            <Mini
              icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
              title="Individual Client Invoices"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Mini
              filledIcon
              icon={
                <Image
                  src={TaxCompliantInvoiceIcon}
                  alt=""
                  width={30}
                  height={30}
                />
              }
              title="Tax-Compliant Business Invoices"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Mini
              icon={<NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />}
              title="Due Date Settings And Automated Invoice Reminders"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2.2 }}>
          <Bullet color={tokens.teal}>
            Refunds and payment adjustments handled per booking when applicable
          </Bullet>
        </Box>
      </Box>
    </Paper>
  );
}
