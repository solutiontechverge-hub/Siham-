"use client";

import AppButton from "../AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  onAccept: () => void;
  onSuggestChange: () => void;
  onReject: () => void;
};

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
          flex: 1,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 900,
          fontSize: 14,
          py: 1.2,
          bgcolor: m.success,
          "&:hover": { bgcolor: m.successDark },
        }}
      >
        Accept
      </AppButton>
      <AppButton
        tone="secondary"
        fullWidth
        onClick={onSuggestChange}
        sx={{
          flex: 1,
          fontSize: 14,
          py: 1.2,
        }}
      >
        Suggest Change
      </AppButton>
      <AppButton
        tone="danger"
        fullWidth
        startIcon={<CloseRoundedIcon />}
        onClick={onReject}
        sx={{
          flex: 1,
          fontSize: 14,
          py: 1.2,
          "&:hover": { bgcolor: "#D94545" },
        }}
      >
        Reject
      </AppButton>
    </Stack>
  );
}
