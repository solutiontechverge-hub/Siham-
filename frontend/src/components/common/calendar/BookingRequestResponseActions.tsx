"use client";

import AppButton from "../AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type BookingRequestResponseActionsProps = {
  onAccept: () => void;
  onSuggestChange: () => void;
  onReject: () => void;
};

const ACTION_SX = {
  flex: 1,
  fontSize: 13,
  py: 1.1,
  minHeight: 40,
} as const;

export default function BookingRequestResponseActions({
  onAccept,
  onSuggestChange,
  onReject,
}: BookingRequestResponseActionsProps) {
  const m = useTheme().palette.mollure;

  return (
    <Stack direction="row" spacing={1}>
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
      <AppButton
        tone="secondary"
        fullWidth
        onClick={onSuggestChange}
        sx={ACTION_SX}
      >
        Suggest Change
      </AppButton>
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
  );
}
