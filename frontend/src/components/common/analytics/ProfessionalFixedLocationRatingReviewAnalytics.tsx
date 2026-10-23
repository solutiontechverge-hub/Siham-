"use client";

import * as React from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
  mollureTableHeaderSx,
} from "../../../theme/mollureHierarchy";
import { useRouter } from "next/navigation";
import type { ProfessionalFixedLocationRatingReviewAnalyticsData } from "../../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import { ratingReviewAnalyticsHref } from "../../../app/professionals/fixed-location/analytics/ratingReviewRoutes";
import {
  REVIEWS_CHANGED_EVENT,
  clientReviewsHref,
  computeReviewStats,
  loadReviewsForShop,
} from "../../../data/clientProfessionalReviews";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import AnalyticsSectionExplanation from "./AnalyticsSectionExplanation";
import ReviewSummaryByCategoryChart from "./ReviewSummaryByCategoryChart";
import { BodyText } from "../../ui/typography";

export type ProfessionalFixedLocationRatingReviewAnalyticsProps = {
  data: ProfessionalFixedLocationRatingReviewAnalyticsData;
};

export default function ProfessionalFixedLocationRatingReviewAnalytics({
  data,
}: ProfessionalFixedLocationRatingReviewAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({
    includeDraft: false,
  });
  const shopId = businessSetupResponse?.data?.id
    ? String(businessSetupResponse.data.id)
    : "";

  const overview = data.reviewManagementOverview;
  const analytics42 = data.ratingReviewAnalytics;
  const analytics43 = data.ratingDistributionByCategory;
  const analytics44 = data.reviewSummaryByCategory;

  const [reviewStats, setReviewStats] = React.useState(() =>
    computeReviewStats([]),
  );

  const refreshReviewStats = React.useCallback(() => {
    setReviewStats(computeReviewStats(loadReviewsForShop(shopId)));
  }, [shopId]);

  React.useEffect(() => {
    refreshReviewStats();
    window.addEventListener(REVIEWS_CHANGED_EVENT, refreshReviewStats);
    window.addEventListener("storage", refreshReviewStats);
    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, refreshReviewStats);
      window.removeEventListener("storage", refreshReviewStats);
    };
  }, [refreshReviewStats]);

  const overallRating = reviewStats.total > 0 ? reviewStats.average : 0;
  const totalReviews = reviewStats.total;
  const ratingOutOf = overview.ratingOutOf;

  function openReviewsPage() {
    if (!shopId) return;
    router.push(
      clientReviewsHref(shopId, undefined, {
        returnTo: ratingReviewAnalyticsHref,
      }),
    );
  }

  return (
    <Box sx={{ px: 2.25, pb: 2.5 }}>
      <Box sx={{ pt: 2.25, pb: 1.4 }}>
        <BodyText
          sx={mollureSectionTitleSx(m.navy)}
        >
          {overview.title}
        </BodyText>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflowX: "auto",
          boxShadow: "none",
          bgcolor: "#fff",
        }}
      >
        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Box
            component="button"
            type="button"
            onClick={() => openReviewsPage()}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 2.5,
              px: 2,
              gap: 0.5,
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              font: "inherit",
              "&:hover": { bgcolor: alpha(m.teal, 0.04) },
            }}
          >
            <BodyText sx={mollureBodyMutedSx(m.navy, { mb: 0.5 })}>
              Overall Rating (Avg.):
            </BodyText>
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <StarRoundedIcon
                sx={{ fontSize: 22, color: theme.palette.warning.main }}
              />
              <BodyText sx={mollurePageTitleSx(m.navy)}>
                {overallRating.toFixed(1)}/
                {ratingOutOf.toFixed(1)}
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
            <BodyText sx={mollureBodyMutedSx(m.navy, { mb: 0.5 })}>
              Total Reviews:
            </BodyText>
            <BodyText sx={mollurePageTitleSx(m.navy)}>
              {totalReviews}
            </BodyText>
          </Box>
        </Stack>
      </Paper>

      {overview.explanationContent ? (
        <AnalyticsSectionExplanation
          label={overview.explanationLabel}
          content={overview.explanationContent}
        />
      ) : null}

      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText
          sx={mollureSectionTitleSx(m.navy)}
        >
          {analytics42.title}
        </BodyText>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflowX: "auto",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha("#9BA3B5", 0.14) }}>
              {(
                [
                  "Rating Category",
                  "Range",
                  "Count",
                  "Share (%)",
                  "Replied To",
                  "Action",
                ] as const
              ).map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.2,
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                  }}
                >
                  <BodyText
                    component="span"
                    sx={mollureTableHeaderSx(m.navy)}
                  >
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
                  <BodyText
                    component="span"
                    sx={mollureBodySx(m.navy, {
                      fontWeight: r.isTotal ? 900 : 700,
                      color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                    })}
                  >
                    {r.category}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={mollureBodySx(m.navy, {
                      fontWeight: r.isTotal ? 900 : 700,
                      color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                    })}
                  >
                    {r.range}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={mollureBodySx(m.navy, {
                      fontWeight: r.isTotal ? 900 : 700,
                      color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                    })}
                  >
                    {r.count}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={mollureBodySx(m.navy, {
                      fontWeight: r.isTotal ? 900 : 700,
                      color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                    })}
                  >
                    {r.sharePct}%
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="span"
                    sx={mollureBodySx(m.navy, {
                      fontWeight: r.isTotal ? 900 : 700,
                      color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                    })}
                  >
                    {r.repliedTo}
                  </BodyText>
                </TableCell>
                <TableCell sx={{ py: 1.1 }}>
                  <BodyText
                    component="button"
                    type="button"
                    onClick={() => openReviewsPage()}
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

      {analytics42.explanationContent ? (
        <AnalyticsSectionExplanation
          label={analytics42.explanationLabel}
          content={analytics42.explanationContent}
        />
      ) : null}

      <Box sx={{ pt: 2.7, pb: 1.4 }}>
        <BodyText
          sx={mollureSectionTitleSx(m.navy)}
        >
          {analytics43.title}
        </BodyText>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.1)}`,
          overflowX: "auto",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha("#9BA3B5", 0.14) }}>
              {(
                [
                  "Category",
                  "Bad (%)",
                  "Good (%)",
                  "Excellent (%)",
                  "Total Reviews",
                ] as const
              ).map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    py: 1.2,
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                  }}
                >
                  <BodyText
                    component="span"
                    sx={mollureTableHeaderSx(m.navy)}
                  >
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
                      sx={mollureBodySx(m.navy, {
                        fontWeight: r.isTotal ? 900 : 700,
                        color: alpha(m.navy, r.isTotal ? 0.82 : 0.65),
                      })}
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

      {analytics43.explanationContent ? (
        <AnalyticsSectionExplanation
          label={analytics43.explanationLabel}
          content={analytics43.explanationContent}
        />
      ) : null}

      <ReviewSummaryByCategoryChart
        title={analytics44.title}
        bars={analytics44.bars}
        maxReviews={analytics44.maxReviews}
      />
    </Box>
  );
}
