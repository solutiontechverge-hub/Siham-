"use client";

import { Box } from "@mui/material";
import { ContentCard } from "../common";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";

export function HowItWorksDiscardingRequestsSection({
  bgshadow,
}: {
  bgshadow: string;
}) {
  return (
      <Box sx={mollureSectionGapSx}>
        <ContentCard
          sx={{
            bgcolor: bgshadow,
            borderRadius: 3,
          }}
          title={howItWorksData.discardingRequests.title}
          titleSx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}
          description={howItWorksData.discardingRequests.description}
        />
      </Box>
  );
}
