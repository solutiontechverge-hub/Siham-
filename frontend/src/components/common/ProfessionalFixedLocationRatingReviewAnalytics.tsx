"use client";

import * as React from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import type { ProfessionalFixedLocationRatingReviewAnalyticsData } from "../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import { ratingReviewReviewsHref } from "../../app/professionals/fixed-location/analytics/ratingReviewRoutes";
import ReviewSummaryByCategoryChart from "./ReviewSummaryByCategoryChart";
import { BodyText } from "../ui/typography";

export type ProfessionalFixedLocationRatingReviewAnalyticsProps = {
  data: ProfessionalFixedLocationRatingReviewAnalyticsData;
};

export default function ProfessionalFixedLocationRatingReviewAnalytics({ data }: ProfessionalFixedLocationRatingReviewAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();

  const overview = data.reviewManagementOverview;
  const analytics42 = data.ratingReviewAnalytics;
  const analytics43 = data.ratingDistributionByCategory;
  const analytics44 = data.reviewSummaryByCategory;

  function openReviewsPage(category: string) {
    router.push(ratingReviewReviewsHref(category));
  }

  function ExplanationBlock({ description, category }: { description: string; category: string }) {
    return (
      <Box sx={{ pt: 1.2, pb: 0.25 }}>
        <BodyText
          component="button"
          type="button"
          onClick={() => openReviewsPage(category)}
          sx={{
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 800,
            color: m.teal,
            textDecoration: "underline",
            display: "block",
            mb: 0.6,
            "&:hover": { color: m.tealDark },
          }}
        >
          View Explanation
        </BodyText>
        <BodyText sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.5), lineHeight: 1.6 }}>
          {description}
        </BodyText>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2.25, pb: 2.5 }}>
      <Box sx={{ pt: 2.25, pb: 1.4 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {overview.title}
        </BodyText>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflow: "hidden",
          boxShadow: "none",
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 2.5,
              px: 2,
              gap: 0.5,
            }}
          >
            <BodyText sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.5 }}>
              Overall Rating (Avg.):
            </BodyText>
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <StarRoundedIcon sx={{ fontSize: 22, color: theme.palette.warning.main }} />
              <BodyText sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
                {overview.overallRating.toFixed(1)}/{overview.ratingOutOf.toFixed(1)}
              </BodyText>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 2.5,
              px: 2,
              gap: 0.5,
            }}
          >
            <BodyText sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.5 }}>
              Total Reviews:
            </BodyText>
            <BodyText sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
              {overview.totalReviews}
            </BodyText>
          </Box>
        </Stack>
      </Paper>

      <ExplanationBlock description={overview.description} category="Excellent" />

      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {analytics42.title}
        </BodyText>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha("#9BA3B5", 0.14) }}>
              {(["Rating Category", "Range", "Count", "Share (%)", "Replied To", "Action"] as const).map((h) => (
                <TableCell key={h} sx={{ py: 1.2, borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}>
                  <BodyText component="span" sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
                    {h}
                  </BodyText>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {analytics42.rows.map((r, idx) => (
              <TableRow
                key={`${r.category}-${idx}`}
                sx={{
                  bgcolor: r.isTotal ? alpha(m.teal, 0.04) : "transparent",
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: r.isTotal ? 900 : 700, color: alpha(m.navy, r.isTotal ? 0.82 : 0.65) }}>
                    {r.category}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: r.isTotal ? 900 : 700, color: alpha(m.navy, r.isTotal ? 0.82 : 0.65) }}>
                    {r.range}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: r.isTotal ? 900 : 700, color: alpha(m.navy, r.isTotal ? 0.82 : 0.65) }}>
                    {r.count}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: r.isTotal ? 900 : 700, color: alpha(m.navy, r.isTotal ? 0.82 : 0.65) }}>
                    {r.sharePct}%
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText component="span" sx={{ fontSize: 12.5, fontWeight: r.isTotal ? 900 : 700, color: alpha(m.navy, r.isTotal ? 0.82 : 0.65) }}>
                    {r.repliedTo}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="button"
                    type="button"
                    onClick={() => openReviewsPage(r.category)}
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: m.teal,
                      cursor: "pointer",
                      textDecoration: "underline",
                      border: 0,
                      bgcolor: "transparent",
                      p: 0,
                      "&:hover": { color: m.tealDark },
                    }}
                  >
                    View/ Reply
                  </BodyText>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ExplanationBlock description={analytics42.description} category="Total Review" />

      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {analytics43.title}
        </BodyText>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha("#9BA3B5", 0.14) }}>
              {(["Category", "Bad (%)", "Good (%)", "Excellent (%)", "Total Reviews"] as const).map((h) => (
                <TableCell key={h} sx={{ py: 1.2, borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}>
                  <BodyText component="span" sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.62) }}>
                    {h}
                  </BodyText>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {analytics43.rows.map((r, idx) => (
              <TableRow
                key={`${r.category}-${idx}`}
                sx={{
                  bgcolor: r.isTotal ? alpha(m.teal, 0.04) : "transparent",
                  "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                {(
                  [
                    r.category,
                    `${r.badPct}%`,
                    `${r.goodPct}%`,
                    `${r.excellentPct}%`,
                    r.totalReviews,
                  ] as (string | number)[]
                ).map((val, ci) => (
                  <TableCell key={ci} sx={{ py: 1.1 }}>
                    <BodyText
                      component="span"
                      sx={{
                        fontSize: 12.5,
                        fontWeight: r.isTotal ? 900 : 700,
                        color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                      }}
                    >
                      {val}
                    </BodyText>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ExplanationBlock description={analytics43.description} category="Total Review" />

      <ReviewSummaryByCategoryChart
        title={analytics44.title}
        bars={analytics44.bars}
        maxReviews={analytics44.maxReviews}
      />
    </Box>
  );
}
