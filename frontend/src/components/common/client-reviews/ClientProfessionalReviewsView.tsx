"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import type { BusinessPublicProfileData, BusinessPublicProfileTeamMember } from "../../../data/businessPublicProfile.data";
import { getServicesForLocationMode } from "../../../data/businessPublicProfile.data";
import {
  REVIEWS_CHANGED_EVENT,
  addClientReview,
  buildClearedReviewFilters,
  buildReviewFilterGroups,
  computeReviewStats,
  ensureDemoReviewsForProfessional,
  filterClientReviews,
  hasActiveReviewFilters,
  formatRelativeReviewTime,
  loadReviewsForProfessional,
  type ClientProfessionalReview,
  upsertClientReviewReply,
} from "../../../data/clientProfessionalReviews";
import type { ProfessionalReviewItem } from "../../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import RatingReviewCard from "../RatingReviewCard";
import ClientReviewsFilterPanel from "./ClientReviewsFilterPanel";
import ClientWriteReviewDialog from "./ClientWriteReviewDialog";

type Props = {
  profile: BusinessPublicProfileData;
  member: BusinessPublicProfileTeamMember;
  locationMode: "fixed" | "desired";
  reviewerName: string;
  seedDemoReviews?: boolean;
};

function toCardReview(review: ClientProfessionalReview): ProfessionalReviewItem {
  return {
    id: review.id,
    reviewerName: review.reviewerName,
    relativeTimeLabel: formatRelativeReviewTime(review.createdAt),
    rating: review.rating,
    reviewText: review.reviewText,
    tags: review.tags,
    reply: review.reply,
  };
}

export default function ClientProfessionalReviewsView({
  profile,
  member,
  locationMode,
  reviewerName,
  seedDemoReviews = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const services = React.useMemo(() => getServicesForLocationMode(profile, locationMode), [profile, locationMode]);
  const filterGroups = React.useMemo(() => buildReviewFilterGroups(profile.categories, services), [profile.categories, services]);
  const [filters, setFilters] = React.useState(() => buildClearedReviewFilters(filterGroups));
  const [reviews, setReviews] = React.useState<ClientProfessionalReview[]>([]);
  const [writeOpen, setWriteOpen] = React.useState(false);

  const refreshReviews = React.useCallback(() => {
    if (seedDemoReviews) {
      ensureDemoReviewsForProfessional(profile.shopId, member.id, services);
    }
    setReviews(loadReviewsForProfessional(profile.shopId, member.id));
  }, [member.id, profile.shopId, seedDemoReviews, services]);

  React.useEffect(() => {
    refreshReviews();
    window.addEventListener(REVIEWS_CHANGED_EVENT, refreshReviews);
    return () => window.removeEventListener(REVIEWS_CHANGED_EVENT, refreshReviews);
  }, [refreshReviews]);

  React.useEffect(() => {
    setFilters(buildClearedReviewFilters(filterGroups));
  }, [filterGroups, member.id]);

  const allStats = React.useMemo(() => computeReviewStats(reviews), [reviews]);
  const filteredReviews = React.useMemo(
    () => filterClientReviews(reviews, filters, filterGroups),
    [reviews, filters, filterGroups],
  );
  const filtersActive = React.useMemo(
    () => hasActiveReviewFilters(filters, filterGroups),
    [filters, filterGroups],
  );
  const hasReviews = reviews.length > 0;
  const maxDistribution = Math.max(...Object.values(allStats.distribution), 1);
  const categoryLabel = profile.specialties[0] ?? services[0]?.categoryTitle ?? "Beauty & Spa";

  const handleSubmitReview = (rating: number, reviewText: string) => {
    const primaryService = services[0];
    addClientReview({
      shopId: profile.shopId,
      memberId: member.id,
      reviewerName,
      rating,
      reviewText,
      tags: primaryService
        ? [{ label: primaryService.name, categoryId: primaryService.categoryId, serviceId: primaryService.id }]
        : [],
    });
    refreshReviews();
  };

  const handleSendReply = (reviewId: string, message: string) => {
    upsertClientReviewReply(reviewId, { authorName: reviewerName, message });
    refreshReviews();
  };

  const handleDeleteReply = (reviewId: string) => {
    upsertClientReviewReply(reviewId, null);
    refreshReviews();
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: "#fff",
          overflow: "hidden",
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 2, py: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <IconButton
              size="small"
              onClick={() => router.push(`/clients/listing/${profile.shopId}`)}
              sx={{ width: 32, height: 32, borderRadius: "8px", color: alpha(m.navy, 0.65) }}
              aria-label="Back to profile"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 900, fontSize: 18, color: alpha(m.navy, 0.88) }}>Reviews &amp; Ratings</Typography>
          </Stack>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
            {categoryLabel} | {member.name}
          </Typography>
        </Stack>

        <Divider />

        <Box sx={{ px: 2, py: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: "10px",
              borderColor: alpha(m.navy, 0.08),
              p: 2,
              mb: 2,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontWeight: 1000, fontSize: 42, lineHeight: 1, color: alpha(m.navy, 0.88) }}>
                  {hasReviews ? allStats.average.toFixed(1) : "0"}
                </Typography>
                <Stack direction="row" spacing={0.25} sx={{ mt: 0.75 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarRoundedIcon
                      key={i}
                      sx={{
                        fontSize: 18,
                        color:
                          hasReviews && i < Math.round(allStats.average) ? m.star : alpha(m.navy, 0.15),
                      }}
                    />
                  ))}
                </Stack>
                <Typography sx={{ mt: 0.75, fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
                  Based on {allStats.total} review{allStats.total === 1 ? "" : "s"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack spacing={0.85}>
                  {([5, 4, 3, 2, 1] as const).map((stars) => {
                    const count = hasReviews ? allStats.distribution[stars] : 0;
                    const widthPct = hasReviews ? (count / maxDistribution) * 100 : 0;
                    return (
                      <Stack key={stars} direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ width: 12, fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                          {stars}
                        </Typography>
                        <Box sx={{ flex: 1, height: 10, borderRadius: "999px", bgcolor: alpha(m.navy, 0.06), overflow: "hidden" }}>
                          <Box sx={{ width: `${widthPct}%`, height: "100%", bgcolor: hasReviews ? m.star : "transparent", borderRadius: "999px" }} />
                        </Box>
                        <Typography sx={{ width: 24, textAlign: "right", fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                          {count}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.78) }}>
                  {!hasReviews
                    ? "No Reviews Found"
                    : filteredReviews.length
                      ? `Showing ${filteredReviews.length} Review${filteredReviews.length === 1 ? "" : "s"}`
                      : "No Reviews Found"}
                </Typography>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => setWriteOpen(true)}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 900,
                    fontSize: 12.5,
                    bgcolor: m.teal,
                    color: "#fff",
                    "&:hover": { bgcolor: m.tealDark, color: "#fff" },
                  }}
                >
                  Write a review
                </Button>
              </Stack>

              {!hasReviews ? (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: "10px",
                    borderColor: alpha(m.navy, 0.08),
                    py: 6,
                    px: 2,
                    textAlign: "center",
                  }}
                >
                  <SearchOffRoundedIcon sx={{ fontSize: 56, color: alpha(m.navy, 0.18), mb: 1 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.45) }}>
                    No reviews for {member.name} yet.
                  </Typography>
                </Paper>
              ) : filteredReviews.length === 0 && filtersActive ? (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: "10px",
                    borderColor: alpha(m.navy, 0.08),
                    py: 6,
                    px: 2,
                    textAlign: "center",
                  }}
                >
                  <SearchOffRoundedIcon sx={{ fontSize: 56, color: alpha(m.navy, 0.18), mb: 1 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.45) }}>
                    No results found for the selected filters.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1.25}>
                  {filteredReviews.map((review) => (
                    <RatingReviewCard
                      key={review.id}
                      review={toCardReview(review)}
                      onSendReply={(message) => handleSendReply(review.id, message)}
                      onDeleteReply={() => handleDeleteReply(review.id)}
                    />
                  ))}
                </Stack>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <ClientReviewsFilterPanel
                groups={filterGroups}
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(buildClearedReviewFilters(filterGroups))}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <ClientWriteReviewDialog open={writeOpen} onClose={() => setWriteOpen(false)} onSubmit={handleSubmitReview} />
    </>
  );
}
