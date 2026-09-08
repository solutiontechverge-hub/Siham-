"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BookingEditTagVariant } from "./bookingRequestNegotiation";

const TAG_LABELS: Record<BookingEditTagVariant, string> = {
  edited: "Edited",
  client_edited: "Edited",
  added: "Added",
  cancelled: "Cancelled",
  pending: "Pending",
  updated: "Updated",
};

type BookingEditedTagProps = {
  variant: BookingEditTagVariant;
  /** Lightweight signpost tooltip — e.g. "View comparison in Activity". */
  signpostTitle?: string;
  onSignpostClick?: () => void;
};

export default function BookingEditedTag({
  variant,
  signpostTitle,
  onSignpostClick,
}: BookingEditedTagProps) {
  const m = useTheme().palette.mollure;
  const isCancelled = variant === "cancelled";
  const isPending = variant === "pending";

  const tag = (
    <Box
      onClick={onSignpostClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.3,
        borderRadius: "999px",
        bgcolor: isCancelled
          ? m.statusRedBg
          : isPending
            ? alpha("#C67A00", 0.14)
            : alpha(m.teal, 0.14),
        color: isCancelled
          ? m.statusRedFg
          : isPending
            ? "#C67A00"
            : m.teal,
        flexShrink: 0,
        cursor: onSignpostClick ? "pointer" : "default",
      }}
    >
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          lineHeight: 1.2,
          color: "inherit",
        }}
      >
        {TAG_LABELS[variant]}
      </Typography>
    </Box>
  );

  if (signpostTitle && variant !== "updated") {
    return (
      <Tooltip title={signpostTitle} placement="top">
        {tag}
      </Tooltip>
    );
  }

  return tag;
}

type BookingChangeTagsProps = {
  variants: readonly BookingEditTagVariant[];
  signpostTitle?: string;
  onSignpostClick?: () => void;
};

export function BookingChangeTags({
  variants,
  signpostTitle,
  onSignpostClick,
}: BookingChangeTagsProps) {
  if (!variants.length) return null;
  return (
    <Stack
      direction="row"
      spacing={0.5}
      useFlexGap
      flexWrap="wrap"
      sx={{ mt: 0.55 }}
    >
      {variants.map((variant) => (
        <BookingEditedTag
          key={variant}
          variant={variant}
          signpostTitle={signpostTitle}
          onSignpostClick={onSignpostClick}
        />
      ))}
    </Stack>
  );
}
