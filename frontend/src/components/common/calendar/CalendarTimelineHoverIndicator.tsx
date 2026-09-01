"use client";

import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";

type CalendarTimelineHoverIndicatorProps = {
  top: number;
  timeLabel: string;
  timeColumnWidth?: number;
};

/** Live hover line with an accurate time label that follows the cursor on the timeline grid. */
export default function CalendarTimelineHoverIndicator({
  top,
  timeLabel,
  timeColumnWidth = 48,
}: CalendarTimelineHoverIndicatorProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const accent = m.teal;

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        zIndex: 6,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: timeColumnWidth - 6,
          top: -3,
          width: 6,
          height: 6,
          borderRadius: "999px",
          bgcolor: accent,
          border: "1px solid #fff",
          boxShadow: `0 0 0 1px ${alpha(accent, 0.25)}`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: timeColumnWidth,
          right: 0,
          top: 0,
          height: 1,
          bgcolor: accent,
          boxShadow: `0 1px 0 ${alpha(accent, 0.18)}`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 2,
          top: -9,
          width: timeColumnWidth - 6,
          display: "flex",
          justifyContent: "flex-end",
          pr: 0.35,
        }}
      >
        <BodyText
          sx={{
            fontSize: 9.5,
            fontWeight: 800,
            color: accent,
            lineHeight: 1,
            bgcolor: alpha("#fff", 0.96),
            px: 0.45,
            py: 0.2,
            borderRadius: "3px",
            border: `1px solid ${alpha(accent, 0.22)}`,
            boxShadow: `0 1px 2px ${alpha(m.navy, 0.08)}`,
          }}
        >
          {timeLabel}
        </BodyText>
      </Box>
    </Box>
  );
}
