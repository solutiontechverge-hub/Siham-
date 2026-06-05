"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, IconButton, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ProfessionalFixedLocationRatingReviewAnalyticsData,
  ProfessionalReviewItem,
  ReviewReply,
} from "../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import { ratingReviewAnalyticsHref } from "../../app/professionals/fixed-location/analytics/ratingReviewRoutes";
import { BodyText, SubHeading } from "../ui/typography";
import RatingReviewCard from "./RatingReviewCard";

export type ProfessionalFixedLocationRatingReviewsPageProps = {
  data: ProfessionalFixedLocationRatingReviewAnalyticsData;
};

export default function ProfessionalFixedLocationRatingReviewsPage({
  data,
}: ProfessionalFixedLocationRatingReviewsPageProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "Excellent";
  const [replyOverrides, setReplyOverrides] = React.useState<Record<string, ReviewReply | null>>({});

  const reviews = React.useMemo(() => {
    const baseReviews = data.reviewsByCategory[category] ?? [];
    return baseReviews.map((rev) => ({
      ...rev,
      reply: rev.id in replyOverrides ? replyOverrides[rev.id] ?? undefined : rev.reply,
    }));
  }, [category, data.reviewsByCategory, replyOverrides]);

  function updateReply(reviewId: string, reply: ReviewReply | null) {
    setReplyOverrides((prev) => ({ ...prev, [reviewId]: reply }));
  }

  function handleSendReply(review: ProfessionalReviewItem, message: string) {
    updateReply(review.id, {
      authorName: review.reply?.authorName ?? "Micheal",
      message,
    });
  }

  function handleDeleteReply(reviewId: string) {
    updateReply(reviewId, null);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        bgcolor: theme.palette.background.paper,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.25, pt: 1.1, pb: 1.5 }}>
        <IconButton
          size="small"
          onClick={() => router.push(ratingReviewAnalyticsHref)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            color: alpha(m.navy, 0.65),
            "&:hover": { bgcolor: alpha(m.teal, 0.08) },
          }}
          aria-label="Back to rating and review analytics"
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <SubHeading sx={{ fontSize: 18, lineHeight: 1.15, color: alpha(m.navy, 0.88) }}>
          Rating and review
        </SubHeading>
      </Stack>

      <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.06) }} />

      <Box sx={{ px: 2.25, py: 2.25 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.25 }}>
          {category} reviews ({reviews.length})
        </BodyText>

        <Stack spacing={1.25}>
          {reviews.map((rev) => (
            <RatingReviewCard
              key={rev.id}
              review={rev}
              onSendReply={(message) => handleSendReply(rev, message)}
              onDeleteReply={() => handleDeleteReply(rev.id)}
            />
          ))}
          {reviews.length === 0 && (
            <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.45) }}>
              No reviews in this category yet.
            </BodyText>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}
