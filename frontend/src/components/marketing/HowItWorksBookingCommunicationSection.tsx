"use client";

import Image from "next/image";
import { Box, Stack } from "@mui/material";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";
import { HowItWorksBookingCommunicationChatIcon } from "../../../images";
import { Typography } from "../ui/typography";
import { sectionHeadingSx } from "./HowItWorksPagePrimitives";

export function HowItWorksBookingCommunicationSection({
  bgshadow,
}: {
  bgshadow: string;
}) {
  return (
      <Box
        sx={{
          ...mollureSectionGapSx,
          bgcolor: bgshadow,
          borderRadius: 3,
          px: { xs: 2.5, sm: 4 },
          py: { xs: 4, sm: 5 },
        }}
      >
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "common.white",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Image
              src={HowItWorksBookingCommunicationChatIcon}
              alt=""
              width={28}
              height={28}
            />
          </Box>
          <Typography
            component="h2"
            variant="h4"
            sx={{
              ...sectionHeadingSx,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: 640,
            }}
          >
            {howItWorksData.bookingCommunication.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "mollure.bodyText",
              fontWeight: 400,
              lineHeight: 1.75,
              maxWidth: 880,
            }}
          >
            {howItWorksData.bookingCommunication.body}
          </Typography>
        </Stack>
      </Box>
  );
}
