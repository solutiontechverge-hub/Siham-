"use client";

import { Box, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ContentCard } from "../common";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import type { MarketingAudience } from "./MarketingShellLayout";
import { MOLLURE_SECTION_GAP_PX } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import { HowItWorksGettingStartedSections } from "./HowItWorksGettingStartedSections";
import { HowItWorksKeyPrinciplesSection } from "./HowItWorksKeyPrinciplesSection";
import { HowItWorksBookingTypesSections } from "./HowItWorksBookingTypesSections";
import { HowItWorksRequestsSections } from "./HowItWorksRequestsSections";
import { HowItWorksPaymentsSections } from "./HowItWorksPaymentsSections";

export function HowItWorksPageContent({
  audience = "clients",
}: {
  audience?: MarketingAudience;
}) {
  const theme = useTheme();
  const bgshadow = theme.palette.mollure.bgshadow;
  const cardbg = theme.palette.mollure.cardbg;
  const textcolorgrey700 = theme.palette.mollure.textcolorgrey700;

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* HERO */}
      <Box
        sx={{
          background: `linear-gradient(180deg, ${theme.palette.mollure.heroGradientStart} 0%, ${theme.palette.mollure.heroGradientEnd} 100%)`,
          position: "relative",
          overflow: "hidden",
          py: { xs: 7, md: 8 },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.65,
            background: theme.palette.mollure.heroGlow,
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              color: "mollure.textcolorgrey700",
              fontSize:
                audience === "clients"
                  ? "52px"
                  : { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            {howItWorksData.hero.title}
          </Typography>
          <Typography
            mt={2}
            maxWidth="700px"
            mx="auto"
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 400, lineHeight: 1.7 }}
          >
            {howItWorksData.hero.subtitle}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: `${MOLLURE_SECTION_GAP_PX}px` }}>
        {/* INTERACTIVE PROCESS */}
        <ContentCard
          sx={{ bgcolor: cardbg, color: textcolorgrey700 }}
          withAccent={true}
          title={howItWorksData.interactiveProcess.title}
          titleSx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
          description={howItWorksData.interactiveProcess.description}
        />

        {audience === "clients" && (
          <HowItWorksGettingStartedSections audience={audience} />
        )}

        <HowItWorksKeyPrinciplesSection cardbg={cardbg} />

        {audience === "professionals" && (
          <HowItWorksGettingStartedSections audience={audience} />
        )}

        <HowItWorksBookingTypesSections audience={audience} />

        <HowItWorksRequestsSections bgshadow={bgshadow} />

        <HowItWorksPaymentsSections audience={audience} bgshadow={bgshadow} />
      </Container>
    </Box>
  );
}
