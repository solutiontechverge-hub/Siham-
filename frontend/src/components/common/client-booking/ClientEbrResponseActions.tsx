"use client";

import AppButton from "../AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type Props = {
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

/** Accept / Suggest Change / Reject row shown when an EBR is incoming on the client booking page. */
export default function ClientEbrResponseActions({
  onAccept,
  onSuggestChange,
  onReject,
}: Props) {
  const m = useTheme().palette.mollure;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.25}
      sx={{ mt: 2 }}
    >
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
