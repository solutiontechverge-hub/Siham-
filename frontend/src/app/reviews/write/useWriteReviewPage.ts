"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "next/navigation";
import {
  useGetReviewInviteQuery,
  useSubmitReviewInviteMutation,
} from "../../../store/services/reviewsApi";
import {
  INPUT_LIMITS,
  parseRating,
  parseText,
  rejectInvalid,
} from "../../../lib/inputSchema";
import { writeReviewCopy } from "./writeReview.data";

export type WriteReviewInviteError = {
  data?: { message?: string };
};

export function useWriteReviewPage() {
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
      setErrorMessage(writeReviewCopy.missingToken);
      return;
    }
    const parsed = rejectInvalid({
      rating: parseRating(rating),
      body: parseText(body, {
        label: writeReviewCopy.reviewFieldLabel,
        min: INPUT_LIMITS.reviewBodyMin,
        max: INPUT_LIMITS.reviewBodyMax,
      }),
    });
    if (!parsed.ok) {
      setErrorMessage(
        parsed.errors.body ||
          parsed.errors.rating ||
          writeReviewCopy.validationFallback,
      );
      return;
    }
    try {
      await submitReview({
        token,
        rating: parsed.values.rating,
        body: parsed.values.body,
      }).unwrap();
      setDone(true);
    } catch (err) {
      const message =
        (err as WriteReviewInviteError)?.data?.message ||
        writeReviewCopy.submitFailedFallback;
      setErrorMessage(message);
    }
  };

  return {
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
    isSubmitting: submitState.isLoading,
  };
}
