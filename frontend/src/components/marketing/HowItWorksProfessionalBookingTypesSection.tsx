"use client";

import { Box, Stack } from "@mui/material";
import { ContentCard } from "../common";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import { cardShadow, cardTitleSx, HowItWorksCheckList } from "./HowItWorksPagePrimitives";

export function HowItWorksProfessionalBookingTypesSection() {
  return (
        <Box
          sx={{
            ...mollureSectionGapSx,
            bgcolor: "mollure.mintSoft",
            borderRadius: 3,
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3.5, sm: 4.5 },
          }}
        >
          <HowItWorksSectionTitle
            title={howItWorksData.sectionTitles.bookingTypes}
            sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
          />

          <Stack spacing={3}>
            <ContentCard
              sx={{
                bgcolor: "background.paper",
                boxShadow: cardShadow,
              }}
            >
              <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                {howItWorksData.professionalBookingTypes.online.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, lineHeight: 1.65 }}
              >
                {howItWorksData.professionalBookingTypes.online.intro}
              </Typography>
              <HowItWorksCheckList
                items={howItWorksData.professionalBookingTypes.online.points}
              />
            </ContentCard>

            <ContentCard
              sx={{
                bgcolor: "background.paper",
                boxShadow: cardShadow,
              }}
            >
              <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                {howItWorksData.professionalBookingTypes.offline.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, lineHeight: 1.65 }}
              >
                {howItWorksData.professionalBookingTypes.offline.intro}
              </Typography>

              <Typography sx={{ ...cardTitleSx, mb: 1.5, fontSize: "1rem" }}>
                {
                  howItWorksData.professionalBookingTypes.offline.nonMollure
                    .title
                }
              </Typography>
              <HowItWorksCheckList
                items={
                  howItWorksData.professionalBookingTypes.offline.nonMollure
                    .points
                }
              />

              <Typography
                sx={{ ...cardTitleSx, mt: 2.5, mb: 1.5, fontSize: "1rem" }}
              >
                {howItWorksData.professionalBookingTypes.offline.guest.title}
              </Typography>
              <HowItWorksCheckList
                items={
                  howItWorksData.professionalBookingTypes.offline.guest.points
                }
              />
            </ContentCard>
          </Stack>
        </Box>
  );
}
