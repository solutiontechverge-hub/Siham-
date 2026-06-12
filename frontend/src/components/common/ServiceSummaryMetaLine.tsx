"use client";

import { Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MollureMetaDot } from "./MollureMetaDot";

type ServiceSummaryMetaLineProps = {
  timeRange?: string;
  durationLabel: string;
};

export function ServiceSummaryMetaLine({ timeRange, durationLabel }: ServiceSummaryMetaLineProps) {
  const m = useTheme().palette.mollure;
  const textSx = { fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.48) };

  return (
    <Stack direction="row" alignItems="center" spacing={0.55} sx={{ mt: 0.25, flexWrap: "wrap" }}>
      {timeRange ? <Typography sx={textSx}>{timeRange}</Typography> : null}
      {timeRange ? <MollureMetaDot /> : null}
      <Typography sx={textSx}>{durationLabel}</Typography>
    </Stack>
  );
}
