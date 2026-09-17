"use client";

import { Box, Grid, Stack } from "@mui/material";
import { ContentCard } from "../common";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import type { MarketingAudience } from "./MarketingShellLayout";
import { mollureHeadingBodyGapSx, mollureSectionGapSx } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import { CreditCard, Language, ReceiptLong } from "@mui/icons-material";
import {
  cardTitleSx,
  HowItWorksRichCheckList,
  sectionHeadingSx,
} from "./HowItWorksPagePrimitives";

export function HowItWorksPaymentsAndInvoicesSection({
  audience,
}: {
  audience: MarketingAudience;
}) {
  return (
      <Box
        sx={{
          ...mollureSectionGapSx,
          bgcolor: "mollure.cardbg",
          borderRadius: 3,
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            ...sectionHeadingSx,
            textAlign: "center",
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.2,
            ...mollureHeadingBodyGapSx,
          }}
        >
          {howItWorksData.paymentsAndInvoices.title}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "success.main",
                    color: "common.white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <CreditCard sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={cardTitleSx}>
                  {howItWorksData.paymentsAndInvoices.prepayment.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "mollure.bodyText",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  {audience === "professionals"
                    ? howItWorksData.paymentsAndInvoices.prepayment.intro
                        .professionals
                    : howItWorksData.paymentsAndInvoices.prepayment.intro
                        .clients}
                </Typography>
                <HowItWorksRichCheckList
                  lines={
                    audience === "professionals"
                      ? howItWorksData.paymentsAndInvoices.prepayment.bullets
                          .professionals
                      : howItWorksData.paymentsAndInvoices.prepayment.bullets
                          .clients
                  }
                />
              </Stack>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "success.main",
                    color: "common.white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Language sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={cardTitleSx}>
                  {howItWorksData.paymentsAndInvoices.postBooking.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "mollure.bodyText",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  {audience === "professionals"
                    ? howItWorksData.paymentsAndInvoices.postBooking.intro
                        .professionals
                    : howItWorksData.paymentsAndInvoices.postBooking.intro
                        .clients}
                </Typography>
                <HowItWorksRichCheckList
                  lines={
                    audience === "professionals"
                      ? howItWorksData.paymentsAndInvoices.postBooking.bullets
                          .professionals
                      : howItWorksData.paymentsAndInvoices.postBooking.bullets
                          .clients
                  }
                />
              </Stack>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "success.main",
                    color: "common.white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ReceiptLong sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={cardTitleSx}>
                  {howItWorksData.paymentsAndInvoices.invoices.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "mollure.bodyText",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  {howItWorksData.paymentsAndInvoices.invoices.intro}
                </Typography>
                <HowItWorksRichCheckList
                  lines={howItWorksData.paymentsAndInvoices.invoices.bullets}
                />
              </Stack>
            </ContentCard>
          </Grid>
        </Grid>
      </Box>
  );
}
