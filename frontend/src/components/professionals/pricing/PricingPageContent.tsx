"use client";

import * as React from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Box, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { pricingPageData } from "../../../app/professionals/pricing/pricing.data";

const MARKETING_CARD_SHADOW = "0 10px 28px rgba(16, 35, 63, 0.10)";

export default function PricingPageContent() {
  const tokens = useTheme().palette.mollure;

  return (
    <>
      <Box sx={{ bgcolor: alpha(tokens.teal, 0.16), borderBottom: `1px solid ${tokens.border}` }}>
        <Container maxWidth="lg" sx={{ py: { xs: 5.25, md: 6.25 } }}>
          <Stack alignItems="center" textAlign="center">
            <Typography
              component="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.04em",
                fontSize: { xs: "2.7rem", md: "4rem" },
                color: tokens.navy,
              }}
            >
              {pricingPageData.hero.title}
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
              {pricingPageData.hero.subtitle}
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
              boxShadow: MARKETING_CARD_SHADOW,
              p: { xs: 2.5, md: 3.25 },
            }}
          >
            <Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="flex-start">
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="baseline" spacing={0.9} sx={{ flexWrap: "wrap" }}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: 18, md: 20 },
                      color: alpha(tokens.navy, 0.92),
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Stripe Fee + 1% Mollure Fee
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: alpha(tokens.navy, 0.5) }}>(Per Online Transaction)</Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  {pricingPageData.featureItems.map((t) => (
                    <Stack key={t} direction="row" spacing={1.25} alignItems="flex-start">
                      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
                      <Typography sx={{ fontSize: 13.5, color: alpha(tokens.navy, 0.7), lineHeight: 1.6 }}>{t}</Typography>
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
              boxShadow: MARKETING_CARD_SHADOW,
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
              Transaction Fees
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
                <Typography sx={{ fontWeight: 900, color: alpha(tokens.navy, 0.86), fontSize: 13 }}>
                  Online Payments
                </Typography>
                <Stack spacing={0.9} sx={{ mt: 1.1 }}>
                  <Typography sx={{ color: alpha(tokens.navy, 0.62), fontSize: 12.5, lineHeight: 1.65 }}>
                    Online payments are securely processed via Stripe.
                  </Typography>
                  <Typography sx={{ color: alpha(tokens.navy, 0.62), fontSize: 12.5, lineHeight: 1.65 }}>
                    For each online transaction:
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ pl: 1 }}>
                    <Box sx={{ mt: "7px", width: 5, height: 5, borderRadius: 99, bgcolor: alpha(tokens.navy, 0.35) }} />
                    <Typography sx={{ color: alpha(tokens.navy, 0.7), fontSize: 12.5, lineHeight: 1.65 }}>
                      <Box component="span" sx={{ fontWeight: 900, color: alpha(tokens.navy, 0.82) }}>
                        Stripe processing fee (based on payment method)
                      </Box>{" "}
                      + 1% Mollure fee (Excluding VAT)
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: alpha(tokens.navy, 0.62), fontSize: 12.5, lineHeight: 1.65 }}>
                    All funds go directly to your own Stripe account. Mollure never holds, processes, or delays your money.
                  </Typography>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: alpha(tokens.navy, 0.12) }} />

              <Box sx={{ p: { xs: 2, md: 2.25 } }}>
                <Typography sx={{ fontWeight: 900, color: alpha(tokens.navy, 0.86), fontSize: 13 }}>
                  Offline Payments
                </Typography>
                <Stack spacing={0.9} sx={{ mt: 1.1 }}>
                  <Typography sx={{ color: alpha(tokens.navy, 0.62), fontSize: 12.5, lineHeight: 1.65 }}>
                    No additional transaction fees.
                  </Typography>
                  <Typography sx={{ color: alpha(tokens.navy, 0.62), fontSize: 12.5, lineHeight: 1.65 }}>
                    You keep 100% of the payment.
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: alpha(tokens.star, 0.08),
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: MARKETING_CARD_SHADOW,
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
              Stripe Processing Fees (Netherlands – Examples)
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1.75 }}>
              {pricingPageData.stripeNetherlandsExamples.map((label) => (
                <Grid key={label} item xs={12} sm={6} md={4}>
                  <Stack direction="row" spacing={1.1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        border: `1.5px solid ${tokens.star}`,
                        bgcolor: "#fff",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ width: 4, height: 4, borderRadius: 999, bgcolor: tokens.star }} />
                    </Box>
                    <Typography sx={{ fontSize: 13.5, color: alpha(tokens.navy, 0.75), fontWeight: 600 }}>
                      {label}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            <Typography sx={{ mt: 3, fontSize: 12.5, color: alpha(tokens.navy, 0.6) }}>
              For the Stripe fees refer to the official pricing page:
            </Typography>
            <Typography
              component="a"
              href={pricingPageData.stripeLocalPaymentMethodsUrl}
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
              {pricingPageData.stripeLocalPaymentMethodsUrl}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 2.5,
              border: `1px solid ${tokens.border}`,
              boxShadow: MARKETING_CARD_SHADOW,
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
              Payout Options
            </Typography>
            <Typography sx={{ mt: 1.25, fontSize: 12.5, color: alpha(tokens.navy, 0.6) }}>
              All payouts are handled directly by Stripe.
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
                  <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: alpha(tokens.navy, 0.86) }}>
                    Standard Payout (Default)
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.7 }}>
                    Free — Funds are deposited to your bank account according to Stripe’s standard schedule (typically 2–3
                    business days).
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
                  <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: alpha(tokens.navy, 0.86) }}>
                    Instant Payout
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.7 }}>
                    1% of payout amount (minimum €0.50) Funds are transferred instantly to your linked debit card. You can
                    manage payout speed and bank details directly in your Stripe dashboard.
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
              boxShadow: MARKETING_CARD_SHADOW,
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
              Stripe &amp; MOLLURE Partnership
            </Typography>
            <Typography sx={{ mt: 1.25, fontSize: 12.5, color: alpha(tokens.navy, 0.6) }}>
              When you activate online payments, you receive your own Stripe Standard Connected Account.
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
                <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: alpha(tokens.navy, 0.86) }}>This Means:</Typography>
                <Stack spacing={0.7} sx={{ mt: 1.15 }}>
                  {pricingPageData.partnershipThisMeans.map((t) => (
                    <Stack key={t} direction="row" spacing={1.1} alignItems="flex-start">
                      <Box sx={{ mt: "7px", width: 5, height: 5, borderRadius: 999, bgcolor: alpha(tokens.navy, 0.35) }} />
                      <Typography sx={{ fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.65 }}>{t}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ borderColor: alpha(tokens.navy, 0.12) }} />

              <Box sx={{ p: { xs: 2, md: 2.25 } }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: alpha(tokens.navy, 0.86) }}>
                  Inside Your Stripe Dashboard, You Can:
                </Typography>
                <Typography sx={{ mt: 1.1, fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.65 }}>
                  Inside your Stripe dashboard, you can:
                </Typography>

                <Stack spacing={0.7} sx={{ mt: 1.15 }}>
                  {pricingPageData.partnershipInsideStripeYouCan.map((t) => (
                    <Stack key={t} direction="row" spacing={1.1} alignItems="flex-start">
                      <Box sx={{ mt: "7px", width: 5, height: 5, borderRadius: 999, bgcolor: alpha(tokens.navy, 0.35) }} />
                      <Typography sx={{ fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.65 }}>{t}</Typography>
                    </Stack>
                  ))}
                </Stack>

                <Typography sx={{ mt: 1.4, fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.65 }}>
                  Additional customization options are available within your Stripe dashboard.
                </Typography>
                <Typography sx={{ mt: 0.85, fontSize: 12.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.65 }}>
                  If you disconnect your Stripe account, your MOLLURE public booking profile will be temporarily disabled until
                  reconnected.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Container>
    </>
  );
}

