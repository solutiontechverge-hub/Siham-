"use client";

import * as React from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import MarketingSectionHeading from "./MarketingSectionHeading";
import MarketingSiteFooter from "./MarketingSiteFooter";
import MarketingSiteHeader from "./MarketingSiteHeader";
import MarketingFeatureCard from "./MarketingFeatureCard";
import MarketingResultCard from "./MarketingResultCard";
import type { professionalsPageData } from "../../app/professionals/professionals.data";
import { useProfessionalsTokens } from "../../app/professionals/professionals.use";
import { ProfessionalsHeroImage } from "../../../images";
import { BodyText as Typography } from "../ui/typography";

type ProfessionalsLandingData = typeof professionalsPageData;

export type ProfessionalLandingProps = {
  data: ProfessionalsLandingData;
};

export default function ProfessionalLanding({
  data,
}: ProfessionalLandingProps) {
  const theme = useTheme();
  const tokens = useProfessionalsTokens();
  const { header, hero, whyChoose, results, pricing, steps, cta, footer } =
    data;

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <MarketingSiteHeader
        navItems={[...header.navItems]}
        localeLabel={header.localeLabel}
        loginLabel={header.loginLabel}
        professionalLinkLabel={header.professionalLinkLabel}
        professionalHref={header.professionalHref}
      />

      {/* Hero */}
      <Box
        sx={{
          background:
            "linear-gradient(115deg, #BFDAB8 0%, #B8E4D4 36%, #92DCE1 72%, #74C9D8 100%)",
          position: "relative",
          overflow: "hidden",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.9,
            background:
              "radial-gradient(circle at 15% 10%, rgba(255,255,255,0.34), transparent 24%), radial-gradient(circle at 78% 52%, rgba(189, 248, 247, 0.3), transparent 18%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              left: { xs: "-22%", md: "-10%" },
              right: { xs: "-16%", md: "-5%" },
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.16)",
              transform: "rotate(-15deg)",
            },
            "&::before": {
              top: { xs: 96, md: 88 },
              height: { xs: 160, md: 228 },
            },
            "&::after": {
              bottom: { xs: 78, md: 82 },
              height: { xs: 170, md: 220 },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 14, md: -34 },
              left: { xs: -90, md: -110 },
              width: { xs: 320, md: 500 },
              height: { xs: 84, md: 120 },
              borderRadius: "999px",
              background: "rgba(255,255,255,0.16)",
              transform: "rotate(26deg)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: { xs: -120, md: -36 },
              top: { xs: 70, md: 62 },
              width: { xs: 360, md: 560 },
              height: { xs: 210, md: 278 },
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.13)",
              transform: "rotate(-11deg)",
            }}
          />
        </Box>
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
            pt: { xs: 5, md: 7 },
            pb: { xs: 3, md: 1.5 },
          }}
        >
          <Grid container spacing={{ xs: 4, md: 2 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack
                spacing={2.5}
                sx={{ maxWidth: 600, pt: { md: 2.25 }, pb: { md: 10 } }}
              >
                <Chip
                  label={hero.eyebrow}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "mollure.chipBg",
                    color: "mollure.tealDark",
                    borderRadius: 999,
                    fontWeight: 500,
                    fontSize: 12,
                    height: 24,
                    px: 0.95,
                  }}
                />
                <Typography
                  component="h1"
                  sx={{
                    whiteSpace: "pre-line",
                    fontSize: { xs: "2.55rem", sm: "3.35rem", md: "4.05rem" },
                    lineHeight: { xs: 1.08, md: 1.03 },
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: "text.primary",
                  }}
                >
                  {hero.title}
                </Typography>
                <Typography
                  sx={{
                    whiteSpace: "pre-line",
                    fontSize: { xs: "1rem", md: "1.0625rem" },
                    lineHeight: 1.5,
                    color: alpha(theme.palette.mollure.navy, 0.55),
                    maxWidth: 500,
                  }}
                >
                  {hero.description}
                </Typography>
                <Button
                  variant="contained"
                  disableElevation
                  sx={{
                    width: "fit-content",
                    px: 3.1,
                    py: 1.1,
                    borderRadius: "10px",
                    textTransform: "none",
                    color: "common.white",
                    bgcolor: "mollure.teal",
                    "&:hover": { bgcolor: tokens.tealDark },
                    boxShadow: "0 16px 34px rgba(33, 184, 191, 0.26)",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {hero.primaryAction}
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 330, sm: 395, md: 520 },
                  mt: { xs: -1, md: -1 },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    right: { xs: "50%", md: 18 },
                    bottom: { xs: 10, md: 6 },
                    transform: { xs: "translateX(50%)", md: "none" },
                    width: { xs: 290, sm: 360, md: 396 },
                    height: { xs: 290, sm: 360, md: 396 },
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 50% 48%, rgba(187, 245, 246, 0.92) 0%, rgba(171, 233, 238, 0.58) 66%, rgba(171, 233, 238, 0.06) 100%)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    right: { xs: "50%", md: -10 },
                    bottom: 0,
                    transform: { xs: "translateX(50%)", md: "none" },
                    width: { xs: 290, sm: 360, md: 470 },
                    height: { xs: 320, sm: 390, md: 505 },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Image
                      src={ProfessionalsHeroImage}
                      alt="Professional hero"
                      fill
                      priority
                      sizes="(max-width: 600px) 78vw, (max-width: 900px) 50vw, 470px"
                      style={{
                        objectFit: "contain",
                        objectPosition: "center bottom",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: { xs: 1, md: -8.5 },
              ml: { xs: 0, md: 0 },
              width: "100%",
              maxWidth: 900,
              position: "relative",
              zIndex: 2,
              borderRadius: "10px",
              border: `1px solid ${alpha(tokens.navy, 0.1)}`,
              bgcolor: alpha("#ffffff", 0.9),
              backdropFilter: "blur(14px)",
              boxShadow: "0 18px 42px rgba(16, 35, 63, 0.09)",
              overflow: "hidden",
            }}
          >
            <Grid container>
              {hero.heroCards.map((c, idx) => (
                <Grid item xs={6} md={3} key={c.title}>
                  <Box
                    sx={{
                      px: { xs: 2.25, md: 3.2 },
                      py: { xs: 2, md: 2.15 },
                      textAlign: "center",
                      borderRight: {
                        xs:
                          idx % 2 === 0
                            ? `1px solid ${alpha(tokens.navy, 0.08)}`
                            : "none",
                        md:
                          idx !== 3
                            ? `1px solid ${alpha(tokens.navy, 0.08)}`
                            : "none",
                      },
                      borderBottom: {
                        xs:
                          idx < 2
                            ? `1px solid ${alpha(tokens.navy, 0.08)}`
                            : "none",
                        md: "none",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: "mollure.textcolorgrey700",
                        fontSize: { xs: 16, md: 21 },
                        lineHeight: 1.1,
                      }}
                    >
                      {c.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "0.71875rem", md: "0.875rem" },
                        mt: 0.45,
                      }}
                    >
                      {c.subtitle}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Why choose */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
        <MarketingSectionHeading title={whyChoose.title} />
        <Grid container spacing={2.25}>
          {whyChoose.items.map((item) => (
            <Grid key={item.title} item xs={12} md={6}>
              <MarketingFeatureCard
                iconKey={item.iconKey}
                title={item.title}
                description={item.description}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Results */}
      <Box sx={{ bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography
            component="h2"
            sx={{
              fontWeight: 600,
              color: "mollure.textcolorgrey700",
              textAlign: "center",
              fontSize: { xs: "1.75rem", md: "2.15rem" },
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            {results.title}
          </Typography>
          <Typography
            sx={{
              mt: 0.65,
              fontWeight: 400,
              color: alpha(theme.palette.mollure.navy, 0.55),
              textAlign: "center",
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              lineHeight: 1.55,
              maxWidth: 620,
              mx: "auto",
            }}
          >
            {results.subtitle}
          </Typography>

          <Grid
            container
            spacing={0}
            sx={{ borderRadius: "14px", overflow: "hidden" }}
          >
            {results.items.map((r, idx) => (
              <Grid
                key={r.title}
                item
                xs={12}
                md={4}
                sx={{
                  p: { xs: 1.5, md: 2 },
                  borderLeft: {
                    md: idx === 0 ? "none" : `1px solid ${tokens.border}`,
                  },
                }}
              >
                <MarketingResultCard
                  iconKey={r.iconKey}
                  title={r.title}
                  description={r.description}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box sx={{ bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 800,
              color: "mollure.textcolorgrey700",
              fontSize: { xs: "1.9rem", md: "2.35rem" },
              letterSpacing: "-0.02em",
            }}
          >
            {pricing.title}
          </Typography>

          <Box
            sx={{
              mt: { xs: 3.5, md: 4.5 },
              borderRadius: "10px",
              bgcolor: tokens.teal,
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              boxShadow: "0 18px 40px rgba(16, 35, 63, 0.12)",
            }}
          >
            <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="start">
              <Grid item xs={12}>
                <Grid container spacing={2.25}>
                  {pricing.highlights.map((h) => (
                    <Grid key={h.title} item xs={12} md={6}>
                      <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: "common.white",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            mt: "2px",
                          }}
                        >
                          <CheckCircleIcon
                            sx={{ color: "mollure.teal", fontSize: 18 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: "common.white",
                              fontSize: { xs: "0.8125rem", md: "0.875rem" },
                              lineHeight: 1.25,
                            }}
                          >
                            {h.title}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.35,
                              color: alpha(theme.palette.common.white, 0.88),
                              fontSize: { xs: "0.6875rem", md: "0.75rem" },
                              lineHeight: 1.45,
                            }}
                          >
                            {h.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: { xs: 1.5, md: 2.5 },
                  }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      width: "100%",
                      maxWidth: 440,
                      borderRadius: "8px",
                      bgcolor: "#fff",
                      border: `1px solid ${alpha(tokens.navy, 0.1)}`,
                      boxShadow: "0 20px 55px rgba(16, 35, 63, 0.22)",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                      <Stack spacing={1.6}>
                        <Box textAlign="center">
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: "mollure.textcolorgrey700",
                              fontSize: { xs: "0.8125rem", md: "0.875rem" },
                            }}
                          >
                            {pricing.cardTitle}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 1,
                              fontWeight: 800,
                              color: "mollure.textcolorgrey700",
                              fontSize: "1rem",
                            }}
                          >
                            {pricing.cardSubtitle}{" "}
                            <Typography
                              component="span"
                              sx={{
                                fontWeight: 500,
                                color: "text.secondary",
                                fontSize: "0.625rem",
                              }}
                            >
                              {pricing.cardFootnote}
                            </Typography>
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.6,
                              color: "text.secondary",
                              fontSize: "0.625rem",
                            }}
                          >
                            {pricing.cardSubnote}
                          </Typography>
                        </Box>

                        <Divider />

                        <Stack spacing={1.1}>
                          {pricing.features.map((f) => (
                            <Stack
                              key={f}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <CheckCircleOutlineIcon
                                sx={{
                                  color: "primary.main",
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography
                                sx={{
                                  color: alpha(
                                    theme.palette.mollure.navy,
                                    0.55,
                                  ),
                                  fontSize: { xs: "0.6875rem", md: "0.75rem" },
                                  lineHeight: 1.4,
                                  fontWeight: 500,
                                }}
                              >
                                {f}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>

                        <Button
                          variant="contained"
                          disableElevation
                          sx={{
                            mt: 0.5,
                            // borderRadius: "2px",

                            py: 1.05,
                            textTransform: "none",
                            // fontWeight: 800,
                            bgcolor: "mollure.teal",
                            color: "common.white",
                            "&:hover": { bgcolor: "mollure.tealDark" },
                          }}
                        >
                          {pricing.cardCta}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Steps */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
        <MarketingSectionHeading
          title={steps.title}
          subtitle={steps.subtitle}
        />
        <Grid container spacing={2.25}>
          {steps.items.map((s) => (
            <Grid key={s.number} item xs={12} sm={6} md={3}>
              <Stack alignItems="center" textAlign="center" sx={{ px: 1 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: tokens.teal,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 26,
                    boxShadow: "0 16px 28px rgba(40, 185, 195, 0.24)",
                  }}
                >
                  {s.number}
                </Box>
                <Typography
                  sx={{
                    mt: 2,
                    fontWeight: 700,
                    color: "mollure.textcolorgrey700",
                    fontSize: { xs: "0.9375rem", md: "1rem" },
                  }}
                >
                  {s.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: alpha(theme.palette.mollure.navy, 0.55),
                    fontSize: { xs: "0.8125rem", md: "0.875rem" },
                    lineHeight: 1.7,
                    maxWidth: 260,
                  }}
                >
                  {s.description}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ bgcolor: tokens.teal, py: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" textAlign="center" spacing={2.25}>
            <Typography
              component="h2"
              sx={{
                fontWeight: 600,
                color: "common.white",
                fontSize: { xs: "2rem", md: "2.6rem" },
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
              }}
            >
              {cta.title}
            </Typography>
            <Typography
              sx={{
                color: alpha(theme.palette.common.white, 0.86),
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                lineHeight: 1.7,
                maxWidth: 820,
              }}
            >
              {cta.subtitle}
            </Typography>
            <Button
              variant="contained"
              disableElevation
              sx={{
                px: 4,
                py: 1.25,
                bgcolor: "#fff",
                color: tokens.tealDark,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#F5FFFF" },
              }}
            >
              {cta.action}
            </Button>


            <Typography
              sx={{
                color: alpha(theme.palette.common.white, 0.86),
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                lineHeight: 1.7,
                maxWidth: 820,
              }}
            >
              No credit card required • Free for first 50 transactions
            </Typography>
          </Stack>
        </Container>
      </Box>

      <MarketingSiteFooter
        columns={[...footer.columns]}
        copyright={footer.copyright}
      />
    </Box>
  );
}
