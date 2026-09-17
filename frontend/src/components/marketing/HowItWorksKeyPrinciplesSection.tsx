"use client";

import Image from "next/image";
import { Box, Grid, Stack } from "@mui/material";
import { ContentCard } from "../common";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import { cardShadow, cardTitleSx } from "./HowItWorksPagePrimitives";

export function HowItWorksKeyPrinciplesSection({
  cardbg,
}: {
  cardbg: string;
}) {
  return (
    <Box
      sx={{
        ...mollureSectionGapSx,
        bgcolor: cardbg,
        borderRadius: 3,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 3.5, sm: 4.5 },
      }}
    >
      <HowItWorksSectionTitle
        title={howItWorksData.sectionTitles.keyPrinciples}
        sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
      />

      <Grid container spacing={3}>
        {howItWorksData.keyPrinciples.map(({ title, description, icon }) => (
          <Grid item xs={12} sm={6} md={3} key={title}>
            <ContentCard
              sx={{
                height: "100%",
                bgcolor: "background.paper",
                boxShadow: cardShadow,
              }}
            >
              <Stack spacing={2} sx={{ height: "100%" }}>
                <Box sx={{ width: 50, height: 49, flexShrink: 0 }}>
                  <Image src={icon} alt="" width={50} height={49} />
                </Box>

                <Typography sx={cardTitleSx}>{title}</Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  {description}
                </Typography>
              </Stack>
            </ContentCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
