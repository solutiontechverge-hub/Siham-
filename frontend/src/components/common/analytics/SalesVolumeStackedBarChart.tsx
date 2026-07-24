"use client";

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
const ROW_GAP = 14;
const LABEL_COL_W = 108;
const GRID_GAP = 6;
const TICK_STEP = 1000;
const TOTAL_LABEL_MIN_W = 76;

function formatSegmentEur(value: number) {
  return `${value.toLocaleString(undefined, {
    useGrouping: value >= 1000,
    maximumFractionDigits: 0,
  })}€`;
}

function formatTotalEur(value: number) {
  return `${value.toLocaleString(undefined, { useGrouping: false, maximumFractionDigits: 0 })}€`;
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
  const tickCount = maxEur / TICK_STEP + 1;
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
              fontSize: 14,
              fontWeight: 900,
              color: alpha(m.navy, 0.85),
              textAlign: "center",
            }}
          >
            {title}
          </BodyText>
        </Box>
      ) : null}

      <Box sx={{ px: 2.25, pt: title ? 1 : 1.75, pb: 0.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${LABEL_COL_W}px minmax(0, 1fr)`,
            columnGap: `${GRID_GAP}px`,
            rowGap: `${ROW_GAP}px`,
            alignItems: "center",
          }}
        >
          {bars.map((bar) => {
            const barWidthPct = (bar.totalSalesEur / maxEur) * 100;

            return (
              <Box key={bar.category} sx={{ display: "contents" }}>
                <BodyText
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: alpha(m.navy, 0.72),
                    textAlign: "right",
                    pr: 0.25,
                    lineHeight: 1.2,
                  }}
                >
                  {bar.category}
                </BodyText>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `minmax(0, 1fr) ${TOTAL_LABEL_MIN_W}px`,
                    alignItems: "center",
                    columnGap: 1,
                    minHeight: BAR_HEIGHT,
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      height: BAR_HEIGHT,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: BAR_HEIGHT,
                        width: `${barWidthPct}%`,
                        display: "flex",
                        flexDirection: "row",
                        minWidth: 0,
                      }}
                    >
                      {bar.segments.map((seg, segIdx) => {
                        const segPct = (seg.salesEur / bar.totalSalesEur) * 100;
                        const fill = segmentColor(segIdx);
                        const showLabel = segPct >= 13;

                        return (
                          <Box
                            key={`${bar.category}-${seg.service}`}
                            sx={{
                              position: "relative",
                              width: `${segPct}%`,
                              minWidth: showLabel ? 48 : 6,
                              height: "100%",
                              bgcolor: fill,
                              flexShrink: 0,
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
                      textAlign: "left",
                    }}
                  >
                    {`${formatTotalEur(bar.totalSalesEur)} (${bar.totalSharePct}%)`}
                  </BodyText>
                </Box>
              </Box>
            );
          })}

          {/* X-axis — same plot column as bars; 0 aligns with bar start */}
          <Box />
          <Box sx={{ gridColumn: 2, pt: 0.5, pb: 0.25 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `minmax(0, 1fr) ${TOTAL_LABEL_MIN_W}px`,
                columnGap: 1,
              }}
            >
              <Box>
                <Box
                  sx={{ height: 1, bgcolor: alpha(m.navy, 0.4), width: "100%" }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 0.75,
                    width: "100%",
                  }}
                >
                  {Array.from({ length: tickCount }).map((_, i) => {
                    const t = TICK_STEP * i;
                    return (
                      <BodyText
                        key={t}
                        component="span"
                        sx={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: alpha(m.navy, 0.55),
                          lineHeight: 1,
                          transform:
                            i === 0
                              ? "translateX(0)"
                              : i === tickCount - 1
                                ? "translateX(0)"
                                : undefined,
                        }}
                      >
                        {t.toLocaleString()}
                      </BodyText>
                    );
                  })}
                </Box>
              </Box>
              <Box />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: 2.25,
          pb: 2.25,
          pt: 2,
          borderTop: `1px solid ${alpha(m.navy, 0.06)}`,
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
                    key={item.label}
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
