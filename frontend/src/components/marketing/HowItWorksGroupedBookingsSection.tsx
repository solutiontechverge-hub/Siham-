"use client";

import { Box, Grid, Stack } from "@mui/material";
import { ContentCard } from "../common";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureHeadingBodyGapSx, mollureSectionGapSx } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import { CheckOutlined } from "@mui/icons-material";
import { cardTitleSx, sectionHeadingSx } from "./HowItWorksPagePrimitives";

export function HowItWorksGroupedBookingsSection() {
  return (
      <Box
        sx={{
          ...mollureSectionGapSx,
          bgcolor: "mollure.cardbg",
          borderRadius: 3,
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={mollureHeadingBodyGapSx}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "common.white",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <CheckOutlined sx={{ fontSize: 22 }} />
          </Box>
          <Typography
            component="h2"
            variant="h4"
            sx={{
              ...sectionHeadingSx,
              textAlign: "center",
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 0,
            }}
          >
            {howItWorksData.groupedBookings.title}
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                height: "100%",
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={cardTitleSx}>
                  {howItWorksData.groupedBookings.fullPayment.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "mollure.bodyText",
                    fontWeight: 400,
                    lineHeight: 1.65,
                  }}
                >
                  {howItWorksData.groupedBookings.fullPayment.body}
                </Typography>
              </Stack>
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <ContentCard
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                height: "100%",
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={cardTitleSx}>
                  {howItWorksData.groupedBookings.split.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "mollure.bodyText",
                    fontWeight: 400,
                    lineHeight: 1.65,
                  }}
                >
                  {howItWorksData.groupedBookings.split.body}
                </Typography>
              </Stack>
            </ContentCard>
          </Grid>
        </Grid>
      </Box>
  );
}
