"use client";

import Image from "next/image";
import { Box, Grid, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AppCard, ContentCard, ServiceCategoryIcon } from "../common";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import type { MarketingAudience } from "./MarketingShellLayout";
import { mollureSectionGapSx } from "../../theme/spacing";
import {
  HowItWorksBusinessClientIcon,
  HowItWorksIndividualClientIcon,
} from "../../../images";
import { Typography } from "../ui/typography";
import { cardShadow, cardTitleSx, HowItWorksCheckList } from "./HowItWorksPagePrimitives";

export function HowItWorksGettingStartedSections({
  audience,
}: {
  audience: MarketingAudience;
}) {
  return (
    <>
        {/* GETTING STARTED — clients only */}
        {audience === "clients" && (
          <Box sx={mollureSectionGapSx}>
            <HowItWorksSectionTitle
              title={howItWorksData.sectionTitles.gettingStarted}
              sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ContentCard
                  sx={{
                    height: "100%",
                    bgcolor: "background.paper",
                    boxShadow: cardShadow,
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ width: 50, height: 49, flexShrink: 0 }}>
                      <Image
                        src={HowItWorksIndividualClientIcon}
                        alt=""
                        width={50}
                        height={49}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={600}>
                      {howItWorksData.gettingStarted.individualTitle}
                    </Typography>

                    <HowItWorksCheckList
                      items={howItWorksData.gettingStarted.individualPoints}
                    />
                  </Stack>
                </ContentCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ContentCard
                  sx={{
                    height: "100%",
                    bgcolor: "background.paper",
                    boxShadow: cardShadow,
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ width: 50, height: 49, flexShrink: 0 }}>
                      <Image
                        src={HowItWorksBusinessClientIcon}
                        alt=""
                        width={50}
                        height={49}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={600}>
                      {howItWorksData.gettingStarted.businessTitle}
                    </Typography>

                    <HowItWorksCheckList
                      items={howItWorksData.gettingStarted.businessPoints}
                    />
                  </Stack>
                </ContentCard>
              </Grid>
            </Grid>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 3,
                textAlign: "center",
                lineHeight: 1.7,
                maxWidth: 920,
                mx: "auto",
              }}
            >
              {howItWorksData.gettingStarted.note}
            </Typography>
          </Box>
        )}

        {/* GETTING STARTED — professionals only; after Key Principles */}
        {audience === "professionals" && (
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
              title={howItWorksData.sectionTitles.gettingStarted}
              sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}
            />

            <Stack spacing={3}>
              <ContentCard
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                  {howItWorksData.professionalGettingStarted.requirements.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.65 }}
                >
                  {howItWorksData.professionalGettingStarted.requirements.intro}
                </Typography>
                <HowItWorksCheckList
                  items={
                    howItWorksData.professionalGettingStarted.requirements
                      .points
                  }
                />

                <Box
                  sx={{
                    mt: 3,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(4, minmax(0, 1fr))",
                      md: "repeat(7, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  {howItWorksData.professionalGettingStarted.requirements.categories.map(
                    (category) => (
                      <AppCard
                        key={category.label}
                        sx={{
                          width: "100%",
                          minHeight: 96,
                          py: 1.25,
                          px: 1,
                          borderRadius: "12px",
                          boxShadow: "none",
                          border: "1px solid",
                          borderColor: (t) => alpha(t.palette.mollure.navy, 0.1),
                          bgcolor: "mollure.white",
                          textAlign: "center",
                        }}
                      >
                        <Stack
                          spacing={0.75}
                          alignItems="center"
                          justifyContent="center"
                          sx={{ minHeight: 88 }}
                        >
                          <ServiceCategoryIcon
                            iconId={category.iconId}
                            fontSize={26}
                          />
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              lineHeight: 1.25,
                              color: "mollure.navy",
                              px: 0.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              wordBreak: "break-word",
                            }}
                          >
                            {category.label}
                          </Typography>
                        </Stack>
                      </AppCard>
                    ),
                  )}
                </Box>
              </ContentCard>

              <ContentCard
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                  {howItWorksData.professionalGettingStarted.validation.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.65 }}
                >
                  {howItWorksData.professionalGettingStarted.validation.intro}
                </Typography>
                <HowItWorksCheckList
                  items={
                    howItWorksData.professionalGettingStarted.validation.points
                  }
                />
              </ContentCard>
            </Stack>
          </Box>
        )}
    </>
  );
}
