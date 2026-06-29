"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ClientsLandingData } from "../../app/clients/clients.data";
import { buildListingSearchHref } from "../../app/clients/listing/listingSearchParams";
import { clientsShellHeader, type ClientsShellHeaderConfig } from "../../data/marketingShell.data";
import { getFeatureIcon, useClientsPageTokens } from "../../app/clients/clients.use";
import MarketingSectionHeading from "./MarketingSectionHeading";
import MarketingSiteFooter from "./MarketingSiteFooter";
import MollureMarketingHeader from "./MollureMarketingHeader";
import { BodyText as Typography } from "../ui/typography";
import AppMultiSelect from "./AppMultiSelect";
import TestimonialsCarousel from "./TestimonialsCarousel";

export type ClientsLandingOverrides = {
  header?: Partial<ClientsLandingData["header"]>;
  hero?: Partial<ClientsLandingData["hero"]>;
};

export type ClientsLandingProps = {
  data: ClientsLandingData;
  overrides?: ClientsLandingOverrides;
};

export default function ClientsLanding({ data, overrides }: ClientsLandingProps) {
  const tokens = useClientsPageTokens();
  const router = useRouter();

  const header: ClientsShellHeaderConfig = {
    ...clientsShellHeader,
    ...data.header,
    ...(overrides?.header ?? {}),
  } as ClientsShellHeaderConfig;
  const hero = { ...data.hero, ...(overrides?.hero ?? {}) };
  const { whyChooseSection, stepsSection, testimonialsSection, professionalCta, footer } = data;

  const [filterValues, setFilterValues] = React.useState<Record<string, string[]>>(
    () => Object.fromEntries(hero.filters.map((f) => [f.label, []])) as Record<string, string[]>,
  );

  const hasSearchSelection = Object.values(filterValues).some((values) => values.length > 0);

  function handleSearch() {
    if (!hasSearchSelection) return;
    router.push(buildListingSearchHref(filterValues));
  }

  const filterFieldSx = {
    "& .MuiOutlinedInput-root": {
      height: 44,
      bgcolor: "#fff",
      borderRadius: "8px",
      fontSize: 13,
      color: tokens.navy,
      "& fieldset": { borderColor: tokens.inputBorder },
      "&:hover fieldset": { borderColor: tokens.inputBorderHover },
      "&.Mui-focused fieldset": { borderColor: tokens.teal, borderWidth: 1 },
    },
  };

  return (
    <Box sx={{ bgcolor: "background.default", color: tokens.navy }}>
      <MollureMarketingHeader
        navItems={[...header.navItems]}
        localeLabel={header.localeLabel}
        loginLabel={header.loginLabel}
        homeHref="/"
        professionalLinkLabel={header.professionalLinkLabel}
        professionalHref={header.professionalHref}
      />

      <Box
        sx={{
          background: `linear-gradient(180deg, ${tokens.heroGradientStart} 0%, ${tokens.heroGradientEnd} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.65,
            background: tokens.heroGlow,
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 7, md: 10 } }}>
          <Stack alignItems="center" textAlign="center">
            <Chip
              label={hero.eyebrow}
              sx={{
                mb: 3,
                bgcolor: tokens.chipBg,
                color: tokens.tealDark,
                borderRadius: 999,
              }}
            />
            <Typography
              component="h1"
              sx={{
                maxWidth: 900,
                fontSize: { xs: "2.1rem", md: "3.2rem" },
                lineHeight: 1.08,
                fontWeight: 600,
                color: tokens.textcolorgrey700,
                letterSpacing: "-0.04em",
              }}
            >
              {hero.title}
            </Typography>
            <Typography
              sx={{
                mt: 2.5,
                maxWidth: 760,
                fontSize: { xs: 15, md: 18 },
                color: tokens.bodyText,
                lineHeight: 1.75,
                fontWeight: 400,
              }}
            >
              {hero.description}
            </Typography>
            <Button
              component={Link}
              href={hero.primaryActionHref ?? "/clients/listing"}
              variant="outlined"
              disableElevation
              sx={{
                mt: 4,
                px: 3.5,
                py: 1.35,
                textTransform: "none",
                fontWeight: 600,
                borderColor: tokens.teal,
                color: tokens.tealDark,
                "&:hover": { borderColor: tokens.teal, bgcolor: "rgba(255,255,255,0.35)" },
              }}
            >
              {hero.primaryAction}
            </Button>
          </Stack>

          <Card
            sx={{
              mt: { xs: 5, md: 6.5 },
              borderRadius: 2.5,
              boxShadow: "0 18px 40px rgba(16, 24, 40, 0.10)",
              border: `1px solid ${tokens.border}`,
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
              <Grid container spacing={{ xs: 1.75, md: 2.25 }} alignItems="flex-end">
                {hero.filters.map((filter) => (
                  <Grid item xs={12} sm={6} md={3} key={filter.label}>
                    <Typography
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-start"
                      sx={{
                        mb: 0.75,
                        fontSize: 12,
                        fontWeight: 600,
                        color: alpha(tokens.navy, 0.6),
                        letterSpacing: "0.01em",
                      }}
                    >
                      {filter.label}
                    </Typography>
                    <AppMultiSelect
                      fullWidth
                      size="small"
                      value={filterValues[filter.label] ?? []}
                      placeholder={filter.placeholder}
                      options={(filter.options ?? []).map((option) => ({
                        label: option,
                        value: option,
                      }))}
                      onChange={(next) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [filter.label]: next,
                        }))
                      }
                      sx={filterFieldSx}
                    />
                  </Grid>
                ))}

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    type="button"
                    onClick={handleSearch}
                    fullWidth
                    variant="contained"
                    disableElevation
                    disabled={!hasSearchSelection}
                    sx={{
                      height: 44,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: tokens.teal,
                      color: "#fff",
                      "&:hover": { bgcolor: tokens.tealDark },
                      "&.Mui-disabled": {
                        bgcolor: alpha(tokens.teal, 0.35),
                        color: alpha("#fff", 0.85),
                      },
                    }}
                  >
                    {hero.searchAction}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Box sx={{ bgcolor: tokens.surface, py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <MarketingSectionHeading title={whyChooseSection.title} />
          <Grid container spacing={2.5}>
            {whyChooseSection.items.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 2.5,
                    bgcolor: "#fff",
                    border: `1px solid ${tokens.border}`,
                    boxShadow: "0 10px 18px rgba(16, 24, 40, 0.08)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        mb: 1.75,
                        borderRadius: "50%",
                        bgcolor: tokens.mintSoft,
                        color: tokens.teal,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {getFeatureIcon(item.iconKey)}
                    </Box>
                    <Typography sx={{ mb: 0.85, fontSize: 16, fontWeight: 600, lineHeight: 1.25, color: tokens.textcolorgrey700 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ mb: 1, fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, color: tokens.teal }}>
                      {item.body}
                    </Typography>
                    <Typography sx={{ color: tokens.slate, lineHeight: 1.75, fontSize: 13, fontWeight: 400 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <MarketingSectionHeading title={stepsSection.title} />
        <Grid container spacing={2.5}>
          {stepsSection.items.map((step) => (
            <Grid item xs={12} sm={6} md={3} key={step.number}>
              <Stack alignItems="center" textAlign="center" sx={{ px: 1 }}>
                <Box
                  sx={{
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    bgcolor: tokens.teal,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 30,
                    fontWeight: 800,
                    boxShadow: "0 16px 28px rgba(40, 185, 195, 0.24)",
                  }}
                >
                  {step.number}
                </Box>
                <Typography sx={{ mt: 2.2, mb: 0.9, fontSize: 21, fontWeight: 600, color: tokens.textcolorgrey700 }}>
                  {step.title}
                </Typography>
                <Typography sx={{ maxWidth: 240, color: tokens.slate, lineHeight: 1.7, fontSize: 13 }}>
                  {step.body}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: tokens.surface, py: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg">
          <MarketingSectionHeading title={testimonialsSection.title} mb={4} />
          <TestimonialsCarousel items={[...testimonialsSection.items]} />
        </Container>
      </Box>

      <Box sx={{ bgcolor: tokens.teal, py: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" textAlign="center">
            <Typography
              sx={{
                fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem", lg: "2.8rem" },
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#fff",
                whiteSpace: { md: "nowrap" },
              }}
            >
              {professionalCta.title}
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 700, color: "rgba(255,255,255,0.86)", fontSize: 17, lineHeight: 1.8 }}>
              {professionalCta.description}
            </Typography>
            <Button
              variant="contained"
              disableElevation
              sx={{
                mt: 3.5,
                px: 4,
                py: 1.35,
                bgcolor: "#fff",
                color: tokens.tealDark,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": { bgcolor: "#F5FFFF" },
              }}
            >
              {professionalCta.action}
            </Button>
            <Typography sx={{ mt: 2.25, color: "rgba(255,255,255,0.84)", fontSize: 14 }}>
              {professionalCta.supportingText}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <MarketingSiteFooter columns={[...footer.columns]} copyright={footer.copyright} />
    </Box>
  );
}

