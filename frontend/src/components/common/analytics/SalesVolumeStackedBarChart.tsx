"use client";

import { mollureSectionTitleSx } from "../../../theme/mollureHierarchy";

import { Box, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  SalesVolumeCategoryBar,
  SalesVolumeChartLegendGroup,
} from "../../../app/professionals/fixed-location/analytics/salesVolumeAnalytics.data";
import { salesVolumeSegmentColor } from "../../../app/professionals/fixed-location/analytics/salesVolumeChartColors";
import { BodyText } from "../../ui/typography";

type SalesVolumeStackedBarChartProps = {
  title?: string;
  maxEur: number;
  bars: readonly SalesVolumeCategoryBar[];
  legend: readonly SalesVolumeChartLegendGroup[];
};

const BAR_HEIGHT = 50;
const LABEL_COL_W = 108;
const TOTAL_LABEL_W = 110;
const TICK_STEP = 1000;

function formatSegmentEur(value: number) {
  return `${value.toLocaleString(undefined, {
    useGrouping: value >= 1000,
    maximumFractionDigits: 0,
  })}€`;
}

function formatTotalEur(value: number) {
  return `${value.toLocaleString(undefined, {
    useGrouping: false,
    maximumFractionDigits: 0,
  })}€`;
}

function SegmentLabel({
  salesEur,
  sharePct,
  compact,
}: {
  salesEur: number;
  sharePct: number;
  compact?: boolean;
}) {
  const amountSize = compact ? 9 : 11;
  const pctSize = compact ? 8 : 10;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 0.25,
        pointerEvents: "none",
        lineHeight: 1.2,
        textAlign: "center",
        color: "#fff",
        textShadow: "0 1px 3px rgba(0, 60, 70, 0.55)",
      }}
    >
      <Box
        component="span"
        sx={{ fontSize: amountSize, fontWeight: 700, whiteSpace: "nowrap" }}
      >
        {formatSegmentEur(salesEur)}
      </Box>
      <Box
        component="span"
        sx={{ fontSize: pctSize, fontWeight: 600, whiteSpace: "nowrap" }}
      >
        ({sharePct}%)
      </Box>
    </Box>
  );
}

export default function SalesVolumeStackedBarChart({
  title,
  maxEur,
  bars,
  legend,
}: SalesVolumeStackedBarChartProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const tickCount = Math.floor(maxEur / TICK_STEP) + 1;
  const segmentColor = (index: number) => salesVolumeSegmentColor(m, index);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        overflow: "hidden",
        boxShadow: "none",
        bgcolor: "#fff",
      }}
    >
      {title ? (
        <Box sx={{ px: 2.25, pt: 2, pb: 1 }}>
          <BodyText
            sx={{
              ...mollureSectionTitleSx(m.navy),
              textAlign: "center",
            }}
          >
            {title}
          </BodyText>
        </Box>
      ) : null}

      <Stack spacing={1.75} sx={{ px: 2.25, pt: title ? 1 : 1.75, pb: 1 }}>
        {bars.map((bar) => {
          const barWidthPct = Math.min(
            100,
            (bar.totalSalesEur / Math.max(maxEur, 1)) * 100,
          );

          return (
            <Box
              key={bar.category}
              sx={{
                display: "grid",
                gridTemplateColumns: `${LABEL_COL_W}px minmax(0, 1fr) ${TOTAL_LABEL_W}px`,
                columnGap: 1,
                alignItems: "center",
                width: "100%",
              }}
            >
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.72),
                  textAlign: "right",
                  lineHeight: 1.2,
                }}
              >
                {bar.category}
              </BodyText>

              <Box
                sx={{
                  position: "relative",
                  height: BAR_HEIGHT,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${barWidthPct}%`,
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  {bar.segments.map((seg, segIdx) => {
                    const segPct =
                      bar.totalSalesEur > 0
                        ? (seg.salesEur / bar.totalSalesEur) * 100
                        : 0;
                    const showLabel = segPct >= 13;

                    return (
                      <Box
                        key={`${bar.category}-${seg.service}`}
                        sx={{
                          position: "relative",
                          width: `${segPct}%`,
                          minWidth: 0,
                          height: "100%",
                          bgcolor: segmentColor(segIdx),
                          overflow: "hidden",
                        }}
                      >
                        {showLabel ? (
                          <SegmentLabel
                            salesEur={seg.salesEur}
                            sharePct={seg.shareWithinBarPct}
                            compact={segPct < 22}
                          />
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.72),
                  whiteSpace: "nowrap",
                }}
              >
                {`${formatTotalEur(bar.totalSalesEur)} (${bar.totalSharePct}%)`}
              </BodyText>
            </Box>
          );
        })}

        {/* X-axis */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${LABEL_COL_W}px minmax(0, 1fr) ${TOTAL_LABEL_W}px`,
            columnGap: 1,
            width: "100%",
          }}
        >
          <Box />
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                height: "1px",
                width: "100%",
                bgcolor: alpha(m.navy, 0.35),
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 0.75,
                width: "100%",
              }}
            >
              {Array.from({ length: tickCount }).map((_, i) => (
                <BodyText
                  key={TICK_STEP * i}
                  component="span"
                  sx={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: alpha(m.navy, 0.55),
                    lineHeight: 1,
                  }}
                >
                  {(TICK_STEP * i).toLocaleString()}
                </BodyText>
              ))}
            </Box>
          </Box>
          <Box />
        </Box>
      </Stack>

      <Box
        sx={{
          px: 2.25,
          pb: 2.25,
          pt: 2,
          borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
        }}
      >
        <Stack
          direction="row"
          spacing={4}
          flexWrap="wrap"
          useFlexGap
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          {legend.map((group) => (
            <Box key={group.category} sx={{ flex: "1 1 0", minWidth: 120 }}>
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: alpha(m.navy, 0.78),
                  mb: 0.85,
                }}
              >
                {group.category}
              </BodyText>
              <Stack spacing={0.55}>
                {group.items.map((item) => (
                  <Stack
                    key={`${group.category}-${item.label}-${item.colorIndex}`}
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                  >
                    <Box
                      sx={{
                        width: 11,
                        height: 11,
                        borderRadius: "2px",
                        bgcolor: segmentColor(item.colorIndex),
                        flexShrink: 0,
                      }}
                    />
                    <BodyText
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.62),
                        lineHeight: 1.3,
                      }}
                    >
                      {item.label}
                    </BodyText>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}
