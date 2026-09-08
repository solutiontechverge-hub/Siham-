"use client";

import AppButton from "./AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  onAccept: () => void;
  onSuggestChange?: () => void;
  onReject: () => void;
  /** Hide Accept until online prepayment is completed. */
  showAccept?: boolean;
  /** Hide Suggest changes when the professional has never chatted with this client. */
  showSuggestChange?: boolean;
};

const ACTION_SX = {
  flex: 1,
  fontSize: 13,
  py: 1.1,
  minHeight: 40,
  borderRadius: "10px",
} as const;

/** Note-from-sender ke neeche: Choose Your Response + Accept / Suggest changes / Reject. */
export default function BookingResponseActions({
  onAccept,
  onSuggestChange,
  onReject,
  showAccept = true,
  showSuggestChange = true,
}: Props) {
  const m = useTheme().palette.mollure;

  return (
    <Stack spacing={1.15} sx={{ mt: 1.5, width: "100%" }}>
      <Box
        sx={{
          width: "100%",
          borderRadius: "10px",
          bgcolor: alpha(m.teal, 0.1),
          px: 1.75,
          py: 1.05,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: m.teal,
            lineHeight: 1.2,
          }}
        >
          Choose Your Response
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.15}>
        {showAccept ? (
        <AppButton
          fullWidth
          variant="contained"
          disableElevation
          startIcon={<CheckRoundedIcon />}
          onClick={onAccept}
          sx={{
            ...ACTION_SX,
            bgcolor: m.success,
            color: "#fff",
            "&:hover": { bgcolor: m.successDark, color: "#fff" },
          }}
        >
          Accept
        </AppButton>
        ) : null}
        {showSuggestChange ? (
        <AppButton
          tone="secondary"
          fullWidth
          onClick={onSuggestChange}
          sx={ACTION_SX}
        >
          Suggest changes
        </AppButton>
        ) : null}
        <AppButton
          tone="danger"
          fullWidth
          startIcon={<CloseRoundedIcon />}
          onClick={onReject}
          sx={ACTION_SX}
        >
          Reject
        </AppButton>
      </Stack>
    </Stack>
  );
}
