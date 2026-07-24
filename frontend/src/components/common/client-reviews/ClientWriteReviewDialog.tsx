"use client";

import * as React from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";
import AppTextField from "../AppTextField";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, reviewText: string) => void;
};

export default function ClientWriteReviewDialog({
  open,
  onClose,
  onSubmit,
}: Props) {
  const m = useTheme().palette.mollure;
  const [rating, setRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setRating(5);
    setReviewText("");
  }, [open]);

  const handleSubmit = () => {
    const text = reviewText.trim();
    if (!text) return;
    onSubmit(rating, text);
    onClose();
  };

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title="Write a review"
      onClose={onClose}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Submit review"
            onClick={handleSubmit}
            disabled={!reviewText.trim()}
          />
        </>
      }
    >
      <Stack spacing={2} sx={{ py: 1 }}>
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              color: alpha(m.navy, 0.62),
              mb: 0.75,
            }}
          >
            Your rating
          </Typography>
          <Stack direction="row" spacing={0.35}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ButtonBaseStar
                key={i}
                filled={i < rating}
                onClick={() => setRating(i + 1)}
              />
            ))}
          </Stack>
        </Box>
        <AppTextField
          label="Your review"
          placeholder="Share your experience..."
          value={reviewText}
          onChange={(e) => setReviewText((e.target as HTMLInputElement).value)}
          multiline
          minRows={4}
          fullWidth
        />
      </Stack>
    </AppModal>
  );
}

function ButtonBaseStar({
  filled,
  onClick,
}: {
  filled: boolean;
  onClick: () => void;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: 0,
        bgcolor: "transparent",
        cursor: "pointer",
        p: 0.25,
        lineHeight: 0,
      }}
    >
      <StarRoundedIcon
        sx={{ fontSize: 28, color: filled ? m.star : alpha(m.navy, 0.15) }}
      />
    </Box>
  );
}
