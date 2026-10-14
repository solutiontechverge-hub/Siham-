"use client";

import * as React from "react";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  Box,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  MollureMarketingHeader,
  MarketingSiteFooter,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
} from "../../../components/common";
import {
  professionalsMarketingFooter,
  professionalsMarketingHeader,
} from "../../../data/marketingShell.data";
import { pricingPageData } from "./pricing.data";

function FeatureCheckIcon({ color }: { color: string }) {
  return (
    <CheckCircleOutlineRoundedIcon
      sx={{
        fontSize: 18,
        color,
        flexShrink: 0,
      }}
    />
  );
}

function StripeFeeRadioIcon({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: color,
        }}
      />
    </Box>
  );
}

function BulletRow({
  children,
  dotColor,
}: {
  children: React.ReactNode;
  dotColor: string;
}) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          bgcolor: dotColor,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{ fontSize: 12.5, color: "inherit", lineHeight: 1.65, flex: 1 }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

export default function PricingPageView() {
  const tokens = useTheme().palette.mollure;
  const d = pricingPageData;

  return (
    <Box
      sx={{
        ...stickyFooterPageSx,
        bgcolor: tokens.surface,
        color: tokens.navy,
      }}
    >
      <MollureMarketingHeader
        navItems={[...professionalsMarketingHeader.navItems]}
        localeLabel={professionalsMarketingHeader.localeLabel}
        loginLabel={professionalsMarketingHeader.loginLabel}
        professionalLinkLabel={
          professionalsMarketingHeader.professionalLinkLabel
        }
        professionalHref={professionalsMarketingHeader.professionalHref}
        homeHref="/professionals"
      />

      <Box
        sx={{
          bgcolor: alpha(tokens.teal, 0.16),
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5.25, md: 6.25 } }}>
          <Stack alignItems="center" textAlign="center">
            <Typography
              component="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.04em",
                fontSize: 20,
                color: tokens.navy,
              }}
            >
              {d.hero.title}
            </Typography>
            <Typography
              sx={{
                mt: 1.45,
                maxWidth: 640,
                color: alpha(tokens.navy, 0.6),
                fontSize: { xs: 13.5, md: 14.5 },
                lineHeight: 1.7,
              }}
            >
              {d.hero.subtitle}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3.25, md: 4 } }}>
        <Stack spacing={2.25}>
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: d.cardShadow,
              p: { xs: 2.5, md: 3.25 },
            }}
          >
            <Grid
              container
              spacing={{ xs: 2.5, md: 4 }}
              alignItems="flex-start"
            >
              <Grid item xs={12} md={6}>
                <Stack
                  direction="row"
                  alignItems="baseline"
                  spacing={0.9}
                  sx={{ flexWrap: "wrap" }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: 20,
                      color: alpha(tokens.navy, 0.92),
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {d.plan.title}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, color: alpha(tokens.navy, 0.5) }}
                  >
                    {d.plan.perTransaction}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  {d.plan.features.map((t) => (
                    <Stack
                      key={t}
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                    >
                      <FeatureCheckIcon color={tokens.teal} />
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          color: alpha(tokens.navy, 0.7),
                          lineHeight: 1.6,
                        }}
                      >
                        {t}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              bgcolor: alpha(tokens.teal, 0.04),
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: d.cardShadow,
              p: { xs: 2.5, md: 3.25 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 16.5,
                color: alpha(tokens.navy, 0.9),
                letterSpacing: "-0.02em",
              }}
            >
              {d.transactionFees.title}
            </Typography>

            <Box
              sx={{
                mt: 1.6,
                borderRadius: 2.25,
                border: `2px dashed ${alpha(tokens.navy, 0.28)}`,
                bgcolor: "transparent",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: { xs: 2, md: 2.25 } }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: alpha(tokens.navy, 0.86),
                    fontSize: 13,
                  }}
                >
                  {d.transactionFees.online.title}
                </Typography>
                <Stack spacing={0.9} sx={{ mt: 1.1 }}>
                  {d.transactionFees.online.paragraphs.map((p) => (
                    <Typography
                      key={p}
                      sx={{
                        color: alpha(tokens.navy, 0.62),
                        fontSize: 12.5,
                        lineHeight: 1.65,
                      }}
                    >
                      {p}
                    </Typography>
                  ))}
                  <Box sx={{ pl: 1, color: alpha(tokens.navy, 0.7) }}>
                    <BulletRow dotColor={alpha(tokens.navy, 0.35)}>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 900,
                          color: alpha(tokens.navy, 0.82),
                        }}
                      >
                        {d.transactionFees.online.feeBold}
                      </Box>{" "}
                      {d.transactionFees.online.feeRest}
                    </BulletRow>
                  </Box>
                  <Typography
                    sx={{
                      color: alpha(tokens.navy, 0.62),
                      fontSize: 12.5,
                      lineHeight: 1.65,
                    }}
                  >
                    {d.transactionFees.online.fundsNote}
                  </Typography>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: alpha(tokens.navy, 0.12) }} />

              <Box sx={{ p: { xs: 2, md: 2.25 } }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: alpha(tokens.navy, 0.86),
                    fontSize: 13,
                  }}
                >
                  {d.transactionFees.offline.title}
                </Typography>
                <Stack spacing={0.9} sx={{ mt: 1.1 }}>
                  {d.transactionFees.offline.paragraphs.map((p) => (
                    <Typography
                      key={p}
                      sx={{
                        color: alpha(tokens.navy, 0.62),
                        fontSize: 12.5,
                        lineHeight: 1.65,
                      }}
                    >
                      {p}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: alpha(tokens.star, 0.08),
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: d.cardShadow,
              p: { xs: 2.5, md: 3.25 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 16.5,
                color: alpha(tokens.navy, 0.9),
                letterSpacing: "-0.02em",
              }}
            >
              {d.stripeExamples.title}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1.75 }}>
              {d.stripeExamples.methods.map((label) => (
                <Grid key={label} item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <StripeFeeRadioIcon color={tokens.star} />
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        color: alpha(tokens.navy, 0.75),
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {label}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Typography
              sx={{ mt: 3, fontSize: 12.5, color: alpha(tokens.navy, 0.6) }}
            >
              {d.stripeExamples.referLabel}
            </Typography>
            <Typography
              component="a"
              href={d.stripeExamples.stripePricingUrl}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: "inline-block",
                mt: 1,
                fontSize: 12.5,
                color: alpha(tokens.navy, 0.65),
                textDecorationColor: alpha(tokens.navy, 0.35),
              }}
            >
              {d.stripeExamples.stripePricingUrl}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: d.cardShadow,
              p: { xs: 2.5, md: 3.25 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 16.5,
                color: alpha(tokens.navy, 0.9),
                letterSpacing: "-0.02em",
              }}
            >
              {d.payouts.title}
            </Typography>
            <Typography
              sx={{ mt: 1.25, fontSize: 12.5, color: alpha(tokens.navy, 0.6) }}
            >
              {d.payouts.subtitle}
            </Typography>

            <Grid container spacing={2.25} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: 2.25,
                    border: `2px dashed ${alpha(tokens.navy, 0.28)}`,
                    p: { xs: 2, md: 2.25 },
                    minHeight: 130,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: 13.5,
                      color: alpha(tokens.navy, 0.86),
                    }}
                  >
                    {d.payouts.standard.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 12.5,
                      color: alpha(tokens.navy, 0.62),
                      lineHeight: 1.7,
                    }}
                  >
                    {d.payouts.standard.body}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: 2.25,
                    border: `2px dashed ${alpha(tokens.navy, 0.28)}`,
                    p: { xs: 2, md: 2.25 },
                    minHeight: 130,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: 13.5,
                      color: alpha(tokens.navy, 0.86),
                    }}
                  >
                    {d.payouts.instant.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 12.5,
                      color: alpha(tokens.navy, 0.62),
                      lineHeight: 1.7,
                    }}
                  >
                    {d.payouts.instant.body}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              bgcolor: alpha(tokens.teal, 0.04),
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: d.cardShadow,
              p: { xs: 2.5, md: 3.25 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 16.5,
                color: alpha(tokens.navy, 0.9),
                letterSpacing: "-0.02em",
              }}
            >
              {d.partnership.title}
            </Typography>
            <Typography
              sx={{ mt: 1.25, fontSize: 12.5, color: alpha(tokens.navy, 0.6) }}
            >
              {d.partnership.subtitle}
            </Typography>

            <Box
              sx={{
                mt: 1.8,
                borderRadius: 2.25,
                border: `2px dashed ${alpha(tokens.navy, 0.28)}`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: { xs: 2, md: 2.25 } }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13.5,
                    color: alpha(tokens.navy, 0.86),
                  }}
                >
                  {d.partnership.thisMeans.title}
                </Typography>
                <Stack spacing={0.7} sx={{ mt: 1.15 }}>
                  {d.partnership.thisMeans.items.map((t) => (
                    <Box key={t} sx={{ color: alpha(tokens.navy, 0.62) }}>
                      <BulletRow dotColor={alpha(tokens.navy, 0.35)}>
                        {t}
                      </BulletRow>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ borderColor: alpha(tokens.navy, 0.12) }} />

              <Box sx={{ p: { xs: 2, md: 2.25 } }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 13.5,
                    color: alpha(tokens.navy, 0.86),
                  }}
                >
                  {d.partnership.dashboard.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 1.1,
                    fontSize: 12.5,
                    color: alpha(tokens.navy, 0.62),
                    lineHeight: 1.65,
                  }}
                >
                  {d.partnership.dashboard.intro}
                </Typography>

                <Stack spacing={0.7} sx={{ mt: 1.15 }}>
                  {d.partnership.dashboard.items.map((t) => (
                    <Box key={t} sx={{ color: alpha(tokens.navy, 0.62) }}>
                      <BulletRow dotColor={alpha(tokens.navy, 0.35)}>
                        {t}
                      </BulletRow>
                    </Box>
                  ))}
                </Stack>

                <Typography
                  sx={{
                    mt: 1.4,
                    fontSize: 12.5,
                    color: alpha(tokens.navy, 0.62),
                    lineHeight: 1.65,
                  }}
                >
                  {d.partnership.dashboard.customizationNote}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.85,
                    fontSize: 12.5,
                    color: alpha(tokens.navy, 0.62),
                    lineHeight: 1.65,
                  }}
                >
                  {d.partnership.dashboard.disconnectNote}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Container>

      <MarketingSiteFooter
        columns={professionalsMarketingFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={professionalsMarketingFooter.copyright}
        sx={stickyFooterAnchorSx}
      />
    </Box>
  );
}
