"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import type {
  BusinessPublicProfileData,
  BusinessPublicProfileTeamMember,
} from "../../../data/businessPublicProfile.data";
import { getServicesForLocationMode } from "../../../data/businessPublicProfile.data";
import {
  buildClearedReviewFilters,
  buildReviewFilterGroups,
  filterClientReviews,
  hasActiveReviewFilters,
  formatRelativeReviewTime,
  type ClientProfessionalReview,
} from "../../../data/clientProfessionalReviews";
import type { ProfessionalReviewItem } from "../../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import RatingReviewCard from "../RatingReviewCard";
import ClientReviewsFilterPanel from "./ClientReviewsFilterPanel";
import { useAppSelector } from "../../../store/hooks";
import {
  useDeleteReviewReplyMutation,
  useGetReviewsQuery,
  useReplyToReviewMutation,
  type ReviewItem,
} from "../../../store/services/reviewsApi";
import { useReviewsRealtimeSync } from "../../../hooks/useReviewsRealtimeSync";
import { useSnackbar } from "../AppSnackbar";

type Props = {
  profile: BusinessPublicProfileData;
  member?: BusinessPublicProfileTeamMember | null;
  locationMode: "fixed" | "desired";
  reviewerName: string;
  backHref?: string;
};

function toClientReview(review: ReviewItem): ClientProfessionalReview {
  return {
    id: review.id,
    shopId: review.businessSetupId,
    memberId: review.teamMemberId || "",
    reviewerName: review.reviewerDisplayName || "Client",
    rating: Number(review.rating) || 0,
    reviewText: review.body || "",
    createdAt: review.submittedAt || review.createdAt,
    tags: [
      ...(review.teamMemberName
        ? [{ label: review.teamMemberName }]
        : []),
      ...(review.serviceName
        ? [{ label: review.serviceName, serviceId: review.serviceId || undefined }]
        : []),
    ],
    reply: review.reply
      ? {
          authorName: review.reply.authorName,
          message: review.reply.message,
        }
      : undefined,
  };
}

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
  member = null,
  locationMode,
  reviewerName,
  backHref,
}: Props) {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const userType = useAppSelector((s) => s.auth.user?.user_type);
  const canReplyAsProfessional = userType === "professional";
  useReviewsRealtimeSync({ businessSetupId: profile.shopId });

  const services = React.useMemo(
    () => getServicesForLocationMode(profile, locationMode),
    [profile, locationMode],
  );
  const filterGroups = React.useMemo(
    () => buildReviewFilterGroups(profile.categories, services),
    [profile.categories, services],
  );
  const [filters, setFilters] = React.useState(() =>
    buildClearedReviewFilters(filterGroups),
  );

  const { data, isLoading, isError } = useGetReviewsQuery({
    businessSetupId: profile.shopId,
    ...(member?.id ? { teamMemberId: member.id } : {}),
  });
  const [replyToReview] = useReplyToReviewMutation();
  const [deleteReviewReply] = useDeleteReviewReplyMutation();

  const reviews = React.useMemo(
    () => (data?.data?.reviews ?? []).map(toClientReview),
    [data?.data?.reviews],
  );
  const allStats = data?.data?.stats ?? {
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  React.useEffect(() => {
    setFilters(buildClearedReviewFilters(filterGroups));
  }, [filterGroups, member?.id]);

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
  const categoryLabel =
    profile.specialties[0] ?? services[0]?.categoryTitle ?? "Beauty & Spa";
  const scopeLabel = member?.name || profile.shopName;

  const handleSendReply = async (reviewId: string, message: string) => {
    if (!canReplyAsProfessional) return;
    try {
      await replyToReview({
        reviewId,
        message,
        authorName: reviewerName,
      }).unwrap();
      showSnackbar({ severity: "success", message: "Reply sent." });
    } catch (err) {
      showSnackbar({
        severity: "error",
        message:
          (err as { data?: { message?: string } })?.data?.message ||
          "Could not send reply.",
      });
      throw err;
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!canReplyAsProfessional) return;
    try {
      await deleteReviewReply({ reviewId }).unwrap();
      showSnackbar({ severity: "success", message: "Reply deleted." });
    } catch (err) {
      showSnackbar({
        severity: "error",
        message:
          (err as { data?: { message?: string } })?.data?.message ||
          "Could not delete reply.",
      });
      throw err;
    }
  };

  return (
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
            onClick={() =>
              router.push(backHref || `/clients/listing/${profile.shopId}`)
            }
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              color: alpha(m.navy, 0.65),
            }}
            aria-label="Back to profile"
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography
            sx={{ fontWeight: 900, fontSize: 18, color: alpha(m.navy, 0.88) }}
          >
            Reviews &amp; Ratings
          </Typography>
        </Stack>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.55) }}
        >
          {categoryLabel} | {scopeLabel}
        </Typography>
      </Stack>

      <Divider />

      <Box sx={{ px: 2, py: 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : isError ? (
          <Typography sx={{ py: 4, textAlign: "center", color: alpha(m.navy, 0.55) }}>
            Unable to load reviews.
          </Typography>
        ) : (
          <>
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
                  <Typography
                    sx={{
                      fontWeight: 1000,
                      fontSize: 42,
                      lineHeight: 1,
                      color: alpha(m.navy, 0.88),
                    }}
                  >
                    {hasReviews ? allStats.average.toFixed(1) : "0"}
                  </Typography>
                  <Stack direction="row" spacing={0.25} sx={{ mt: 0.75 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarRoundedIcon
                        key={i}
                        sx={{
                          fontSize: 18,
                          color:
                            hasReviews && i < Math.round(allStats.average)
                              ? m.star
                              : alpha(m.navy, 0.15),
                        }}
                      />
                    ))}
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.75,
                      fontSize: 12,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.5),
                    }}
                  >
                    Based on {allStats.total} review
                    {allStats.total === 1 ? "" : "s"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Stack spacing={0.85}>
                    {([5, 4, 3, 2, 1] as const).map((stars) => {
                      const count = allStats.distribution[stars] || 0;
                      const widthPct = hasReviews
                        ? Math.round((count / maxDistribution) * 100)
                        : 0;
                      return (
                        <Stack
                          key={stars}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Typography
                            sx={{
                              width: 28,
                              fontSize: 11.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.55),
                            }}
                          >
                            {stars}.0
                          </Typography>
                          <Box
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 999,
                              bgcolor: alpha(m.navy, 0.06),
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${widthPct}%`,
                                height: "100%",
                                bgcolor: m.teal,
                                borderRadius: 999,
                              }}
                            />
                          </Box>
                          <Typography
                            sx={{
                              width: 22,
                              textAlign: "right",
                              fontSize: 11.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.45),
                            }}
                          >
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
                <Typography
                  sx={{
                    mb: 1.25,
                    fontWeight: 900,
                    fontSize: 14,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {!hasReviews
                    ? "No Reviews Found"
                    : filteredReviews.length
                      ? `Showing ${filteredReviews.length} Review${filteredReviews.length === 1 ? "" : "s"}`
                      : "No Reviews Found"}
                </Typography>

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
                    <SearchOffRoundedIcon
                      sx={{ fontSize: 56, color: alpha(m.navy, 0.18), mb: 1 }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: alpha(m.navy, 0.45),
                      }}
                    >
                      No reviews for {scopeLabel} yet.
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
                    <SearchOffRoundedIcon
                      sx={{ fontSize: 56, color: alpha(m.navy, 0.18), mb: 1 }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: alpha(m.navy, 0.45),
                      }}
                    >
                      No results found for the selected filters.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.25}>
                    {filteredReviews.map((review) => (
                      <RatingReviewCard
                        key={review.id}
                        review={toCardReview(review)}
                        onSendReply={
                          canReplyAsProfessional
                            ? (message) => handleSendReply(review.id, message)
                            : undefined
                        }
                        onDeleteReply={
                          canReplyAsProfessional
                            ? () => handleDeleteReply(review.id)
                            : undefined
                        }
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
                  onClear={() =>
                    setFilters(buildClearedReviewFilters(filterGroups))
                  }
                />
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Paper>
  );
}
