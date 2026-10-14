"use client";

import { Box, Grid, Stack } from "@mui/material";
import { ContentCard } from "../common";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureHeadingBodyGapSx, mollureSectionGapSx } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import {
  CheckOutlined,
  EventSeatOutlined,
  PersonPinCircleOutlined,
} from "@mui/icons-material";
import { cardTitleSx, sectionHeadingSx } from "./HowItWorksPagePrimitives";

export function HowItWorksReschedulingSection() {
  return (
      <Box
        sx={{
          ...mollureSectionGapSx,
          bgcolor: "mollure.bgshadow",
          borderRadius: 3,
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            ...sectionHeadingSx,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.2,
            ...mollureHeadingBodyGapSx,
          }}
        >
          {howItWorksData.clientRescheduling.title}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "primary.main",
                      color: "common.white",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <EventSeatOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    {howItWorksData.clientRescheduling.fixedLocation.title}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "mollure.bodyText", lineHeight: 1.65 }}
                >
                  {howItWorksData.clientRescheduling.fixedLocation.body}
                </Typography>

                <Box sx={{ mt: "auto", pt: 1 }}>
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      bgcolor: "mollure.statusGreenBg",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        bgcolor: "mollure.statusGreenFg",
                        color: "common.white",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckOutlined sx={{ fontSize: 15 }} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "mollure.statusGreenFg",
                      }}
                    >
                      {howItWorksData.clientRescheduling.fixedLocation.badge}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "primary.main",
                      color: "common.white",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PersonPinCircleOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    {howItWorksData.clientRescheduling.desiredLocation.title}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "mollure.bodyText", lineHeight: 1.65 }}
                >
                  {howItWorksData.clientRescheduling.desiredLocation.body}
                </Typography>

                <Box sx={{ mt: "auto", pt: 1 }}>
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      bgcolor: "mollure.warmwarning",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        bgcolor: "mollure.star",
                        color: "common.white",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckOutlined sx={{ fontSize: 15 }} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "mollure.textcolorgrey700",
                      }}
                    >
                      {howItWorksData.clientRescheduling.desiredLocation.badge}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </ContentCard>
          </Grid>
        </Grid>
      </Box>
  );
}
