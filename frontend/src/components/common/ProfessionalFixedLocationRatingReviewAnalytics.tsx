"use client";

import * as React from "react";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Avatar, Box, Chip, Collapse, IconButton, Menu, MenuItem, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ProfessionalFixedLocationRatingReviewAnalyticsData, ProfessionalReviewItem } from "../../app/professionals/fixed-location/analytics/ratingReviewAnalytics.data";
import { BodyText } from "../ui/typography";
import AppTextField from "./AppTextField";
import { useSnackbar } from "./AppSnackbar";

export type ProfessionalFixedLocationRatingReviewAnalyticsProps = {
  data: ProfessionalFixedLocationRatingReviewAnalyticsData;
};

function RatingPill({ value }: { value: number }) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  return (
    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ color: alpha(m.navy, 0.7) }}>
      <BodyText component="span" sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
        {value.toFixed(1)}
      </BodyText>
      <StarRoundedIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
    </Stack>
  );
}

function ReviewTags({ tags }: { tags: readonly { label: string }[] }) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.05 }}>
      {tags.map((t, idx) => {
        const isGroup = /^TM\s+\d+/i.test(t.label);
        return (
          <Chip
            key={`${t.label}-${idx}`}
            label={t.label}
            size="small"
            sx={{
              height: 18,
              borderRadius: "999px",
              bgcolor: isGroup ? alpha(m.navy, 0.05) : alpha(m.teal, 0.08),
              color: isGroup ? alpha(m.navy, 0.6) : alpha(m.tealDark, 0.95),
              fontWeight: isGroup ? 800 : 800,
              fontSize: 10.5,
              "& .MuiChip-label": { px: 0.9 },
              border: `1px solid ${isGroup ? alpha(m.navy, 0.08) : alpha(m.teal, 0.14)}`,
            }}
          />
        );
      })}
    </Stack>
  );
}

function ReviewCard({
  review,
  onEditReply,
  onDeleteReply,
}: {
  review: ProfessionalReviewItem;
  onEditReply: () => void;
  onDeleteReply: () => void;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const [replyExpanded, setReplyExpanded] = React.useState(Boolean(review.reply));
  const [draftReply, setDraftReply] = React.useState("");

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        overflow: "hidden",
        boxShadow: "none",
        bgcolor: "#fff",
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(m.navy, 0.08), color: alpha(m.navy, 0.65), fontWeight: 900, fontSize: 12 }}>
          {review.reviewerName.slice(0, 1).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <BodyText sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.8), lineHeight: 1.15 }}>
                {review.reviewerName}
              </BodyText>
              <BodyText sx={{ mt: 0.15, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.45) }}>
                {review.relativeTimeLabel}
              </BodyText>
            </Box>
            <RatingPill value={review.rating} />
          </Stack>

          <BodyText sx={{ mt: 1.05, fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.55), lineHeight: 1.55 }}>
            {review.reviewText}
          </BodyText>

          <ReviewTags tags={review.tags} />

          <BodyText
            component="button"
            type="button"
            onClick={() => setReplyExpanded((v) => !v)}
            sx={{
              mt: 1.2,
              p: 0,
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              color: m.teal,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "underline",
              "&:hover": { color: m.tealDark },
            }}
          >
            Reply
          </BodyText>

          <Collapse in={replyExpanded} timeout={180}>
            <Box
              sx={{
                mt: 1.1,
                borderRadius: "10px",
                border: `1px solid ${alpha(m.teal, 0.5)}`,
                bgcolor: alpha(m.teal, 0.05),
                px: 1.25,
                py: 1.1,
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {review.reply ? (
                    <>
                      <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.72) }}>
                        Reply from {review.reply.authorName}
                      </BodyText>
                      <BodyText sx={{ mt: 0.35, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.5), lineHeight: 1.55 }}>
                        {review.reply.message}
                      </BodyText>
                    </>
                  ) : (
                    <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.5) }}>Type Reply</BodyText>
                  )}
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: "#fff",
                  }}
                  aria-label="Reply actions"
                >
                  <MoreVertRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      boxShadow: "0 18px 50px rgba(16, 35, 63, 0.12)",
                      overflow: "hidden",
                      minWidth: 120,
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      onEditReply();
                      showSnackbar({ severity: "info", message: "Edit reply is not implemented yet." });
                    }}
                    sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.7) }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      onDeleteReply();
                      showSnackbar({ severity: "info", message: "Delete reply is not implemented yet." });
                    }}
                    sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.7) }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <AppTextField
                placeholder="Type Reply"
                value={draftReply}
                onChange={(e) => setDraftReply((e.target as HTMLInputElement).value)}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: "10px",
                  },
                  "& .MuiOutlinedInput-input": {
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.68),
                    py: 1.15,
                  },
                }}
              />
              <IconButton
                onClick={() => showSnackbar({ severity: "info", message: "Send reply is not implemented yet." })}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: alpha(m.teal, 0.12),
                  border: `1px solid ${alpha(m.teal, 0.25)}`,
                  "&:hover": { bgcolor: alpha(m.teal, 0.18) },
                }}
                aria-label="Send reply"
              >
                <SendRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
              </IconButton>
            </Stack>
          </Collapse>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function ProfessionalFixedLocationRatingReviewAnalytics({ data }: ProfessionalFixedLocationRatingReviewAnalyticsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const section = data.excellentReviews;

  return (
    <Box sx={{ px: 2.25, pb: 2.5 }}>
      <Box sx={{ pt: 2.25, pb: 1.4 }}>
        <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {section.title} ({section.reviews.length})
        </BodyText>
      </Box>

      <Stack spacing={1.25}>
        {section.reviews.map((r) => (
          <ReviewCard key={r.id} review={r} onEditReply={() => void 0} onDeleteReply={() => void 0} />
        ))}
      </Stack>
    </Box>
  );
}

