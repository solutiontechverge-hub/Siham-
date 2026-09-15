"use client";

import { Box, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ProfessionalFeaturesPageData } from "../../../app/professionals/professionalFeatures.data";
import MarketingSiteFooter from "./MarketingSiteFooter";
import {
  stickyFooterAnchorSx,
  stickyFooterPageSx,
} from "../StickyFooterPageShell";
import MollureMarketingHeader from "./MollureMarketingHeader";
import { ProfessionalFeaturesCards } from "./ProfessionalFeaturesCards";

export type ProfessionalFeaturesProps = {
  data: ProfessionalFeaturesPageData;
};

export default function ProfessionalFeatures({
  data,
}: ProfessionalFeaturesProps) {
  const tokens = useTheme().palette.mollure;
  const { header, footer } = data;

  return (
    <Box
      sx={{
        ...stickyFooterPageSx,
        bgcolor: tokens.surface,
        color: tokens.navy,
      }}
    >
      <MollureMarketingHeader
        navItems={[...header.navItems]}
        localeLabel={header.localeLabel}
        loginLabel={header.loginLabel}
        professionalLinkLabel={header.professionalLinkLabel}
        professionalHref={header.professionalHref}
        homeHref="/professionals"
      />

      {/* HERO */}
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
                fontSize: { xs: "2.7rem", md: "4rem" },
                color: tokens.navy,
              }}
            >
              {data.title}
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
              {data.subtitle}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3.25, md: 4 } }}>
        <ProfessionalFeaturesCards />
      </Container>

      <MarketingSiteFooter
        columns={footer.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={footer.copyright}
        sx={stickyFooterAnchorSx}
      />
    </Box>
  );
}
