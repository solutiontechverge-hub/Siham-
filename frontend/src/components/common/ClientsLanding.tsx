"use client";

import * as React from "react";
import Image from "next/image";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Stack,
} from "@mui/material";
import { Profile as AvatarImage } from "../../../images";
import type { ClientsLandingData } from "../../app/clients/clients.data";
import { clientsShellHeader, type ClientsShellHeaderConfig } from "../../data/marketingShell.data";
import { getFeatureIcon, useClientsPageTokens } from "../../app/clients/clients.use";
import MarketingSectionHeading from "./MarketingSectionHeading";
import MarketingSiteFooter from "./MarketingSiteFooter";
import MollureMarketingHeader from "./MollureMarketingHeader";
import { BodyText as Typography } from "../ui/typography";
import { MollureTextField } from ".";

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

  const header: ClientsShellHeaderConfig = {
    ...clientsShellHeader,
    ...data.header,
    ...(overrides?.header ?? {}),
  } as ClientsShellHeaderConfig;
  const hero = { ...data.hero, ...(overrides?.hero ?? {}) };
  const { whyChooseSection, stepsSection, testimonialsSection, professionalCta, footer } = data;

  const [filterValues, setFilterValues] = React.useState<Record<string, string>>(
    () =>
      Object.fromEntries(hero.filters.map((f) => [f.label, ""])) as Record<
        string,
        string
      >,
  );

  return (
    <Box sx={{ bgcolor: "background.default", color: tokens.navy }}>
      <MollureMarketingHeader
        navItems={[...header.navItems]}
        localeLabel={header.localeLabel}
        loginLabel={header.loginLabel}
        homeHref="/clients"
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
              borderRadius: 3.5,
              boxShadow: "0 20px 45px rgba(40, 92, 112, 0.10)",
              border: `1px solid ${tokens.border}`,
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Grid container spacing={1.75} alignItems="flex-end">
                {hero.filters.map((filter) => (
                  <Grid item xs={12} sm={6} md={3} key={filter.label}>
                    <Typography
                      display={"flex"}
                      alignItems={"center"}
                      justifyContent={"center"}
                      sx={{
                        mb: 0.75,
                        fontSize: 11,
                        fontWeight: 700,
                        color: tokens.slate,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {filter.label}
                    </Typography>
                    <MollureTextField
                      select={!!filter.options?.length}
                      fullWidth
                      size="small"
                      value={filterValues[filter.label] ?? ""}
                      onChange={(e) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [filter.label]: e.target.value,
                        }))
                      }
                      placeholder={!filter.options?.length ? filter.placeholder : undefined}
                      SelectProps={{
                        displayEmpty: true,
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              mt: 1,
                              borderRadius: 2,
                              border: `1px solid ${tokens.border}`,
                              boxShadow: "0 18px 44px rgba(16, 24, 40, 0.14)",
                            },
                          },
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 44,
                          bgcolor: "#fff",
                          borderRadius: "6px",
                          fontSize: 13,
                          color: tokens.navy,
                          "& fieldset": { borderColor: tokens.inputBorder },
                          "&:hover fieldset": { borderColor: tokens.inputBorderHover },
                          "&.Mui-focused fieldset": { borderColor: tokens.teal, borderWidth: 1 },
                        },
                        "& input::placeholder": { color: tokens.placeholder, opacity: 1 },
                      }}
                    >
                      {filter.options?.length ? (
                        <MenuItem value="" sx={{ color: tokens.placeholder, fontStyle: "italic" }}>
                          {filter.placeholder}
                        </MenuItem>
                      ) : null}
                      {filter.options?.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </MollureTextField>
                  </Grid>
                ))}

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    disableElevation
                    sx={{
                      height: 44,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: tokens.teal,
                      "&:hover": { bgcolor: tokens.tealDark },
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

      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
        <MarketingSectionHeading title={testimonialsSection.title} mb={4} />
        <Grid container spacing={2.5}>
          {testimonialsSection.items.map((testimonial) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={testimonial.id}>
              <Card sx={{ height: "100%", borderRadius: 3, border: `1px solid ${tokens.border}`, bgcolor: "#fff", overflow: "hidden", boxShadow: "0 14px 28px rgba(16, 24, 40, 0.08)" }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ bgcolor: "rgba(33, 184, 191, 0.10)", px: 2, pt: 2, pb: 3, position: "relative" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: "#fff", border: `1px solid ${tokens.border}`, overflow: "hidden", flexShrink: 0 }}>
                        <Image src={AvatarImage} alt={testimonial.name} width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: tokens.navy, fontSize: 14, lineHeight: 1.2 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: tokens.bodyText, lineHeight: 1.25 }}>
                          {testimonial.role}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: tokens.slate, lineHeight: 1.25 }}>
                          TheWebagency
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)" }}>
                      <Stack direction="row" spacing={0.3} sx={{ px: 1.5, py: 0.55, borderRadius: 999, bgcolor: "#fff", border: `1px solid ${tokens.border}`, boxShadow: "0 4px 10px rgba(0,0,0,0.08)" }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarRoundedIcon key={i} sx={{ fontSize: 16, color: tokens.star }} />
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                  <Box sx={{ px: 2.5, pt: 3.75, pb: 2.5, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 13, color: tokens.slate, lineHeight: 1.7 }}>
                      {testimonial.text}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: tokens.teal, py: { xs: 7, md: 8 } }}>
        <Container maxWidth="md">
          <Stack alignItems="center" textAlign="center">
            <Typography sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, lineHeight: 1.1, color: "#fff" }}>
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

