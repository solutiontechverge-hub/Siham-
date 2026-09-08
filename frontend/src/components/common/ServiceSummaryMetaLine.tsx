"use client";

import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MollureMetaDot } from "./MollureMetaDot";
import { BodyText } from "../ui/typography";

type ServiceSummaryMetaLineProps = {
  timeRange?: string;
  durationLabel?: string;
  staffName?: string;
};

export function ServiceSummaryMetaLine({
  timeRange,
  durationLabel,
  staffName,
}: ServiceSummaryMetaLineProps) {
  const m = useTheme().palette.mollure;
  const textSx = {
    m: 0,
    fontSize: 10.5,
    fontWeight: 700,
    color: alpha(m.navy, 0.48),
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.55}
      sx={{ mt: 0.25, flexWrap: "wrap" }}
    >
      {timeRange ? <BodyText sx={textSx}>{timeRange}</BodyText> : null}
      {timeRange && durationLabel ? <MollureMetaDot /> : null}
      {durationLabel ? (
        <BodyText sx={textSx}>{durationLabel}</BodyText>
      ) : null}
      {staffName && (timeRange || durationLabel) ? <MollureMetaDot /> : null}
      {staffName ? <BodyText sx={textSx}>{staffName}</BodyText> : null}
    </Stack>
  );
}
