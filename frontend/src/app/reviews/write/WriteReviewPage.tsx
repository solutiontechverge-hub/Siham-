"use client";

import * as React from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSearchParams } from "next/navigation";
import AppButton from "../../../components/common/AppButton";
import AppTextField from "../../../components/common/AppTextField";
import {
  useGetReviewInviteQuery,
  useSubmitReviewInviteMutation,
} from "../../../store/services/reviewsApi";

export default function WriteReviewPage() {
  const m = useTheme().palette.mollure;
  const searchParams = useSearchParams();
  const token = searchParams?.get("token")?.trim() ?? "";
  const { data, isLoading, isError, error } = useGetReviewInviteQuery(token, {
    skip: !token,
  });
  const [submitReview, submitState] = useSubmitReviewInviteMutation();
  const [rating, setRating] = React.useState(5);
  const [body, setBody] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const invite = data?.data;

  React.useEffect(() => {
    if (invite?.alreadySubmitted) setDone(true);
  }, [invite?.alreadySubmitted]);

  const handleSubmit = async () => {
    setErrorMessage("");
    if (!token) {
      setErrorMessage("Missing review token.");
      return;
    }
    if (body.trim().length < 3) {
      setErrorMessage("Please write at least a few words about your visit.");
      return;
    }
    try {
      await submitReview({ token, rating, body: body.trim() }).unwrap();
      setDone(true);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Could not submit your review. Please try again.";
      setErrorMessage(message);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: 6 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 3, borderRadius: "12px" }}>
            <Typography sx={{ fontWeight: 800 }}>Invalid review link.</Typography>
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
              {(error as { data?: { message?: string } })?.data?.message ||
                "This review invite is invalid or no longer available."}
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
          <Typography
            sx={{ fontWeight: 900, fontSize: 22, color: alpha(m.navy, 0.9) }}
          >
            Write a review
          </Typography>
          <Typography
            sx={{ mt: 0.75, fontSize: 13.5, color: alpha(m.navy, 0.55) }}
          >
            {invite.salonName}
            {invite.teamMemberName ? ` · ${invite.teamMemberName}` : ""}
            {invite.serviceName ? ` · ${invite.serviceName}` : ""}
          </Typography>

          {done || invite.alreadySubmitted ? (
            <Typography sx={{ mt: 3, fontWeight: 700, color: alpha(m.navy, 0.7) }}>
              Thank you! Your review has been submitted.
            </Typography>
          ) : invite.expired ? (
            <Typography sx={{ mt: 3, fontWeight: 700, color: alpha(m.navy, 0.7) }}>
              This review invite has expired.
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
                      aria-label={`Rate ${value} stars`}
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
                placeholder="Share your experience..."
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
                disabled={submitState.isLoading}
              >
                {submitState.isLoading ? "Submitting..." : "Submit review"}
              </AppButton>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
