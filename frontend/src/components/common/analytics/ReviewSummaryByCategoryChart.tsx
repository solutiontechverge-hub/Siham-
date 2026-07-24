"use client";

import { Box, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReviewSummaryBar } from "../../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import { BodyText } from "../../ui/typography";

type Props = {
  title: string;
  bars: readonly ReviewSummaryBar[];
  maxReviews: number;
};

const BAR_HEIGHT = 46;
const ROW_GAP = 14;
const LABEL_COL_W = 112;
const GRID_GAP = 6;
const TICK_STEP = 1000;
/** Scale: 1 review = N units on 0–6000 axis */
const REVIEW_SCALE = 200;
const MAX_AXIS = 6000;
const TICK_COUNT = MAX_AXIS / TICK_STEP + 1;
const TOTAL_LABEL_W = 80;

/** Teal shades: bad (dark), good (medium), excellent (light) */
const SEG_COLORS = ["#169BA1", "#21B8BF", "#6DC8CD"] as const;

function pctLabel(pct: number) {
  return `${pct}%`;
}

export default function ReviewSummaryByCategoryChart({ title, bars }: Props) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: "10px",
        border: `1px dotted ${alpha(m.teal, 0.35)}`,
        overflow: "hidden",
        boxShadow: "none",
        bgcolor: "#fff",
      }}
    >
      {title ? (
        <Box sx={{ px: 2.25, pt: 2, pb: 1 }}>
          <BodyText
            sx={{
              fontSize: 13.5,
              fontWeight: 900,
              color: alpha(m.navy, 0.85),
              textAlign: "center",
            }}
          >
            {title}
          </BodyText>
        </Box>
      ) : null}

      <Box sx={{ px: 2.25, pt: 1, pb: 0.5 }}>
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
            const barWidthPct =
              ((bar.totalReviews * REVIEW_SCALE) / MAX_AXIS) * 100;
            const segments = [
              { pct: bar.badPct, color: SEG_COLORS[0] },
              { pct: bar.goodPct, color: SEG_COLORS[1] },
              { pct: bar.excellentPct, color: SEG_COLORS[2] },
            ];

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
                    gridTemplateColumns: `minmax(0, 1fr) ${TOTAL_LABEL_W}px`,
                    alignItems: "center",
                    columnGap: 1,
                    minHeight: BAR_HEIGHT,
                  }}
                >
                  <Box sx={{ position: "relative", height: BAR_HEIGHT }}>
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: BAR_HEIGHT,
                        width: `${barWidthPct}%`,
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      {segments.map((seg, si) => {
                        const showLabel = seg.pct >= 14;
                        const isWhiteText = si < 2;
                        return (
                          <Box
                            key={si}
                            sx={{
                              position: "relative",
                              width: `${seg.pct}%`,
                              minWidth: 0,
                              height: "100%",
                              bgcolor: seg.color,
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {showLabel && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: isWhiteText
                                    ? "#fff"
                                    : alpha(m.navy, 0.72),
                                  textShadow: isWhiteText
                                    ? "0 1px 3px rgba(0,60,70,0.45)"
                                    : "none",
                                  pointerEvents: "none",
                                }}
                              >
                                <BodyText
                                  component="span"
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {pctLabel(seg.pct)}
                                </BodyText>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  <BodyText
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.65),
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    {bar.totalReviews} Reviews
                  </BodyText>
                </Box>
              </Box>
            );
          })}

          {/* X-axis */}
          <Box />
          <Box sx={{ gridColumn: 2, pt: 0.5, pb: 0.5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `minmax(0, 1fr) ${TOTAL_LABEL_W}px`,
                columnGap: 1,
              }}
            >
              <Box>
                <Box
                  sx={{
                    height: 1,
                    bgcolor: alpha(m.navy, 0.35),
                    width: "100%",
                  }}
                />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mt: 0.75 }}
                >
                  {Array.from({ length: TICK_COUNT }).map((_, i) => (
                    <BodyText
                      key={i}
                      component="span"
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 500,
                        color: alpha(m.navy, 0.5),
                        lineHeight: 1,
                      }}
                    >
                      {(TICK_STEP * i).toLocaleString()}
                    </BodyText>
                  ))}
                </Stack>
              </Box>
              <Box />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ px: 2.25, pt: 1.5, pb: 2 }}>
        <Stack direction="row" spacing={3} justifyContent="center">
          {(["Bad", "Good", "Excellent"] as const).map((label, i) => (
            <Stack
              key={label}
              direction="row"
              alignItems="center"
              spacing={0.75}
            >
              <Box
                sx={{
                  width: 11,
                  height: 11,
                  borderRadius: "2px",
                  bgcolor: SEG_COLORS[i],
                  flexShrink: 0,
                }}
              />
              <BodyText
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.6),
                }}
              >
                {label}
              </BodyText>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}
