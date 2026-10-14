"use client";

import Image from "next/image";
import { Box, Grid, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AppCard } from "../common";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";
import {
  HowItWorksDesiredLocationBookingIcon,
  HowItWorksFixedLocationBookingIcon,
  HowItWorksDesiredLocationClockIcon,
} from "../../../images";
import { Typography } from "../ui/typography";
import { CheckCircle } from "@mui/icons-material";

export function HowItWorksProfessionalServiceLocationSection() {
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
            title={howItWorksData.professionalServiceLocationSetup.title}
            sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.5,
              mb: 3,
              textAlign: "center",
              lineHeight: 1.65,
              maxWidth: 720,
              mx: "auto",
            }}
          >
            {howItWorksData.professionalServiceLocationSetup.subtitle}
          </Typography>

          <AppCard
            sx={{
              p: { xs: 2.5, sm: 4 },
              borderRadius: "28px",
            }}
          >
            <Stack spacing={4}>
              {/* Fixed Location */}
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "mollure.cardBorder",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "common.white",
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Image
                    src={HowItWorksFixedLocationBookingIcon}
                    alt=""
                    width={40}
                    height={40}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "common.white" }}
                  >
                    {howItWorksData.professionalServiceLocationSetup.fixedLocation.title}
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "mollure.bodyText", mb: 3 }}
                  >
                    {
                      howItWorksData.professionalServiceLocationSetup
                        .fixedLocation.intro
                    }
                  </Typography>

                  <Grid container spacing={2.5}>
                    {howItWorksData.professionalServiceLocationSetup.fixedLocation.features.map(
                      (f) => (
                        <Grid item xs={12} sm={6} key={f.title}>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                          >
                            <CheckCircle
                              sx={{
                                color: "primary.main",
                                fontSize: 22,
                                flexShrink: 0,
                                mt: 0.25,
                              }}
                            />
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  color: "mollure.textcolorgrey700",
                                  mb: 0.5,
                                }}
                              >
                                {f.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {f.sub}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                      ),
                    )}
                  </Grid>
                </Box>
              </Box>

              {/* Desired Location */}
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "mollure.cardBorder",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "common.white",
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Image
                    src={HowItWorksDesiredLocationBookingIcon}
                    alt=""
                    width={40}
                    height={40}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "common.white" }}
                  >
                    {howItWorksData.professionalServiceLocationSetup.desiredLocation.title}
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "mollure.bodyText", mb: 3 }}
                  >
                    {
                      howItWorksData.professionalServiceLocationSetup
                        .desiredLocation.intro
                    }
                  </Typography>

                  {/* Standard */}
                  <Box
                    sx={(t) => ({
                      border: "2px dashed",
                      borderColor: alpha(t.palette.primary.main, 0.35),
                      borderRadius: 2,
                      p: 2.5,
                      mb: 2.5,
                    })}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 0.75,
                          borderRadius: 1,
                          bgcolor: "primary.main",
                          color: "common.white",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                        >
                          {howItWorksData.professionalServiceLocationSetup.desiredLocation.standardBadge}
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2.5}>
                      {howItWorksData.professionalServiceLocationSetup.desiredLocation.standard.map(
                        (f) => (
                          <Grid item xs={12} sm={6} key={f.title}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="flex-start"
                            >
                              <CheckCircle
                                sx={{
                                  color: "primary.main",
                                  fontSize: 22,
                                  flexShrink: 0,
                                  mt: 0.25,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "mollure.textcolorgrey700",
                                    mb: 0.5,
                                  }}
                                >
                                  {f.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {f.sub}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </Box>

                  {/* Project */}
                  <Box
                    sx={(t) => ({
                      border: "2px dashed",
                      borderColor: alpha(t.palette.primary.main, 0.35),
                      borderRadius: 2,
                      p: 2.5,
                      mb: 2.5,
                    })}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 0.75,
                          borderRadius: 1,
                          bgcolor: "primary.main",
                          color: "common.white",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                        >
                          {howItWorksData.professionalServiceLocationSetup.desiredLocation.projectBadge}
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2.5}>
                      {howItWorksData.professionalServiceLocationSetup.desiredLocation.project.map(
                        (f) => (
                          <Grid item xs={12} sm={6} key={f.title}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="flex-start"
                            >
                              <CheckCircle
                                sx={{
                                  color: "primary.main",
                                  fontSize: 22,
                                  flexShrink: 0,
                                  mt: 0.25,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "mollure.textcolorgrey700",
                                    mb: 0.5,
                                  }}
                                >
                                  {f.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {f.sub}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "mollure.warmwarning",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Image
                        src={HowItWorksDesiredLocationClockIcon}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      {howItWorksData.professionalServiceLocationSetup.note}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </AppCard>
        </Box>
  );
}
