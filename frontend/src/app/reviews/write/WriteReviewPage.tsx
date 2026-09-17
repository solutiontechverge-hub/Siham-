"use client";

import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  mollurePageSubtitleSx,
  mollurePageTitleSx,
} from "../../../theme/mollureHierarchy";
import AppButton from "../../../components/common/AppButton";
import AppTextField from "../../../components/common/AppTextField";
import { writeReviewCopy } from "./writeReview.data";
import {
  useWriteReviewPage,
  type WriteReviewInviteError,
} from "./useWriteReviewPage";

export default function WriteReviewPage() {
  const {
    m,
    token,
    invite,
    isLoading,
    isError,
    error,
    rating,
    setRating,
    body,
    setBody,
    done,
    errorMessage,
    handleSubmit,
    isSubmitting,
  } = useWriteReviewPage();

  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: 6 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 3, borderRadius: "12px" }}>
            <Typography sx={{ fontWeight: 800 }}>
              {writeReviewCopy.invalidLink}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !invite) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: 6 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 3, borderRadius: "12px" }}>
            <Typography sx={{ fontWeight: 800 }}>
              {(error as WriteReviewInviteError)?.data?.message ||
                writeReviewCopy.inviteUnavailable}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: 6 }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "14px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
          }}
        >
          <Typography sx={mollurePageTitleSx(m.navy)}>
            {writeReviewCopy.title}
          </Typography>
          <Typography sx={mollurePageSubtitleSx(m.navy, { mt: 0.75 })}>
            {invite.salonName}
            {invite.teamMemberName ? ` · ${invite.teamMemberName}` : ""}
            {invite.serviceName ? ` · ${invite.serviceName}` : ""}
          </Typography>

          {done || invite.alreadySubmitted ? (
            <Typography
              sx={{ mt: 3, fontWeight: 700, color: alpha(m.navy, 0.7) }}
            >
              {writeReviewCopy.thankYou}
            </Typography>
          ) : invite.expired ? (
            <Typography
              sx={{ mt: 3, fontWeight: 700, color: alpha(m.navy, 0.7) }}
            >
              {writeReviewCopy.expired}
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Stack direction="row" spacing={0.5}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <Box
                      key={value}
                      component="button"
                      type="button"
                      onClick={() => setRating(value)}
                      sx={{
                        border: 0,
                        bgcolor: "transparent",
                        cursor: "pointer",
                        p: 0.25,
                      }}
                      aria-label={writeReviewCopy.rateAria(value)}
                    >
                      <StarRoundedIcon
                        sx={{
                          fontSize: 34,
                          color: value <= rating ? m.star : alpha(m.navy, 0.18),
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>

              <AppTextField
                multiline
                minRows={4}
                placeholder={writeReviewCopy.bodyPlaceholder}
                value={body}
                onChange={(e) =>
                  setBody(
                    (e.target as HTMLInputElement | HTMLTextAreaElement).value,
                  )
                }
              />

              {errorMessage ? (
                <Typography sx={{ color: "error.main", fontSize: 13 }}>
                  {errorMessage}
                </Typography>
              ) : null}

              <AppButton
                tone="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? writeReviewCopy.submitting
                  : writeReviewCopy.submit}
              </AppButton>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
