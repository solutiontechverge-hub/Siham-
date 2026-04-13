"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import MarketingSiteFooter from "./MarketingSiteFooter";
import MarketingSiteHeader from "./MarketingSiteHeader";
import type { ProfessionalFeaturesPageData } from "../../app/professionals/professionalFeatures.data";
import { useProfessionalsTokens } from "../../app/professionals/professionals.use";
import { BodyText as Typography } from "../ui/typography";

export type ProfessionalFeaturesProps = {
  data: ProfessionalFeaturesPageData;
};

function MiniCard({
  iconKey,
  title,
  subtitle,
}: {
  iconKey: import("../../app/professionals/professionalFeatures.data").ProfessionalFeaturesMiniCardIconKey;
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const icon =
    iconKey === "fixedLocation" ? (
      <StorefrontRoundedIcon sx={{ fontSize: 18 }} />
    ) : iconKey === "desiredLocation" ? (
      <PlaceRoundedIcon sx={{ fontSize: 18 }} />
    ) : iconKey === "combinable" ? (
      <LinkRoundedIcon sx={{ fontSize: 18 }} />
    ) : (
      <WorkspacesRoundedIcon sx={{ fontSize: 18 }} />
    );

  return (
    <Box
      sx={{
        bgcolor: "common.white",
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 20px rgba(16, 35, 63, 0.08)",
        px: { xs: 1.4, md: 1.6 },
        py: { xs: 1.25, md: 1.35 },
        display: "flex",
        gap: 1.2,
        alignItems: "center",
        minHeight: 56,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "9px",
          bgcolor: m.teal,
          color: "common.white",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            color: "mollure.textcolorgrey700",
            fontSize: 13,
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.35,
            color: alpha(m.navy, 0.55),
            fontSize: 10.5,
            lineHeight: 1.25,
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

function getTintBg(tint: ProfessionalFeaturesPageData["sections"][number]["tint"]) {
  switch (tint) {
    case "mint":
      return "#EAF9F4";
    case "sand":
      return "#FFF4DF";
    case "sky":
      return "#EAF6FF";
    case "teal":
    default:
      return "#D9F3F4";
  }
}

export default function ProfessionalFeatures({ data }: ProfessionalFeaturesProps) {
  const theme = useTheme();
  const m = useProfessionalsTokens();
  const { header, title, subtitle, sections, footer } = data;

  const previewToneColor = React.useCallback(
    (tone?: "teal" | "navy" | "slate") => {
      const mp = theme.palette.mollure;
      switch (tone) {
        case "navy":
          return mp.navy;
        case "slate":
          return alpha(mp.navy, 0.65);
        case "teal":
        default:
          return mp.teal;
      }
    },
    [theme.palette.mollure],
  );

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <MarketingSiteHeader
        navItems={[...header.navItems]}
        localeLabel={header.localeLabel}
        loginLabel={header.loginLabel}
        professionalLinkLabel={header.professionalLinkLabel}
        professionalHref={header.professionalHref}
      />

      <Box
        sx={{
          bgcolor: "#CFF0F3",
          position: "relative",
          overflow: "hidden",
          borderBottom: `1px solid ${m.border}`,
          "&:after": {
            content: '""',
            position: "absolute",
            right: { xs: -40, md: 60 },
            top: { xs: 40, md: 50 },
            width: { xs: 160, md: 220 },
            height: { xs: 160, md: 220 },
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 62%)",
            transform: "rotate(15deg)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ pt: { xs: 7, md: 9 }, pb: { xs: 6, md: 7 } }}>
          <Stack spacing={1.25} alignItems="center" textAlign="center">
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                color: "mollure.textcolorgrey700",
                letterSpacing: "-0.04em",
                fontSize: { xs: "2.1rem", md: "2.65rem" },
                lineHeight: 1.12,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontWeight: 400,
                color: alpha(theme.palette.mollure.navy, 0.55),
                fontSize: { xs: "0.9rem", md: "1rem" },
                lineHeight: 1.75,
                maxWidth: 760,
              }}
            >
              {subtitle}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={{ xs: 2.5, md: 3.5 }}>
          {sections.map((section) => {
            const tintBg = getTintBg(section.tint);
            return (
              <Box
                key={section.title}
                sx={{
                  borderRadius: "14px",
                  bgcolor: tintBg,
                  p: { xs: 2, sm: 2.5, md: 3 },
                  border: `1px solid ${alpha(m.navy, 0.06)}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    right: 14,
                    top: 14,
                    width: 88,
                    height: 88,
                    opacity: 0.55,
                    display: { xs: "none", sm: "block" },
                    "& span": { display: "block" },
                  }}
                >
                  <Box sx={{ position: "absolute", right: 0, top: 0, width: 42, height: 42, borderRadius: "10px", bgcolor: alpha(m.teal, 0.22), transform: "rotate(45deg)" }} />
                  <Box sx={{ position: "absolute", right: 22, top: 28, width: 42, height: 42, borderRadius: "10px", bgcolor: alpha(m.teal, 0.18), transform: "rotate(45deg)" }} />
                  <Box sx={{ position: "absolute", right: 2, top: 50, width: 42, height: 42, borderRadius: "10px", bgcolor: alpha(m.teal, 0.14), transform: "rotate(45deg)" }} />
                </Box>

                <Stack spacing={1.25}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: "mollure.textcolorgrey700",
                      fontSize: { xs: "0.95rem", md: "1.05rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    {section.title}
                  </Typography>

                  {section.intro ? (
                    <Typography
                      sx={{
                        color: alpha(theme.palette.mollure.navy, 0.55),
                        fontSize: 11,
                        lineHeight: 1.45,
                      }}
                    >
                      {section.intro}
                    </Typography>
                  ) : null}

                  <Stack spacing={1.15}>
                    {section.bullets.map((b) => (
                      <Stack key={b} direction="row" spacing={1.1} alignItems="flex-start">
                        <CheckCircleOutlineIcon
                          sx={{ color: "mollure.teal", fontSize: 16, mt: "2px", flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            color: alpha(theme.palette.mollure.navy, 0.65),
                            fontSize: 12.5,
                            lineHeight: 1.55,
                          }}
                        >
                          {b}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {section.detail?.cardsRow?.length ? (
                    <Grid container spacing={1.6} sx={{ pt: 0.6 }}>
                      {section.detail.cardsRow.map((c) => (
                        <Grid key={c.title} item xs={12} sm={6}>
                              <MiniCard iconKey={c.iconKey} title={c.title} subtitle={c.subtitle} />
                        </Grid>
                      ))}
                    </Grid>
                  ) : null}

                  {section.detail?.dashedGroup ? (
                    <Box
                      sx={{
                        mt: 0.5,
                        borderRadius: "12px",
                        border: `1px dashed ${alpha(m.teal, 0.55)}`,
                        bgcolor: alpha(m.teal, 0.05),
                        p: { xs: 1.6, md: 2 },
                      }}
                    >
                      <Stack spacing={1.4}>
                        <Stack direction="row" spacing={1.1} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              bgcolor: "common.white",
                              border: `1px solid ${alpha(m.teal, 0.38)}`,
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                              mt: "2px",
                            }}
                          >
                            <CheckCircleOutlineIcon sx={{ color: "mollure.teal", fontSize: 15 }} />
                          </Box>
                          <Typography
                            sx={{
                              color: alpha(theme.palette.mollure.navy, 0.65),
                              fontSize: 12.5,
                              lineHeight: 1.55,
                            }}
                          >
                            {section.detail.dashedGroup.title}
                          </Typography>
                        </Stack>

                        <Grid container spacing={1.6}>
                          {section.detail.dashedGroup.cards.map((c) => (
                            <Grid key={c.title} item xs={12} sm={6}>
                              <MiniCard iconKey={c.iconKey} title={c.title} subtitle={c.subtitle} />
                            </Grid>
                          ))}
                        </Grid>
                      </Stack>
                    </Box>
                  ) : null}

                  {section.detail?.twoColumnList?.length ? (
                    <Grid container spacing={2} sx={{ pt: 0.35 }}>
                      {section.detail.twoColumnList.map(
                        (
                          cols: { left: readonly string[]; right: readonly string[] },
                          idx: number,
                        ) => (
                          <React.Fragment key={idx}>
                          <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                              {cols.left.map((t: string) => (
                                <Stack key={t} direction="row" spacing={1} alignItems="flex-start">
                                  <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: alpha(m.navy, 0.35), mt: "8px" }} />
                                  <Typography sx={{ color: alpha(theme.palette.mollure.navy, 0.62), fontSize: 11.5, lineHeight: 1.55 }}>
                                    {t}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                              {cols.right.map((t: string) => (
                                <Stack key={t} direction="row" spacing={1} alignItems="flex-start">
                                  <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: alpha(m.navy, 0.35), mt: "8px" }} />
                                  <Typography sx={{ color: alpha(theme.palette.mollure.navy, 0.62), fontSize: 11.5, lineHeight: 1.55 }}>
                                    {t}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Grid>
                        </React.Fragment>
                        ),
                      )}
                    </Grid>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Container>

      <MarketingSiteFooter columns={[...footer.columns]} copyright={footer.copyright} />
    </Box>
  );
}

