"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  onAccept: () => void;
  onSuggestChange: () => void;
  onReject: () => void;
};

/** Accept / Suggest Change / Reject row shown when an EBR is incoming on the client booking page. */
export default function ClientEbrResponseActions({ onAccept, onSuggestChange, onReject }: Props) {
  const m = useTheme().palette.mollure;

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
      <Button
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
      </Button>
      <Button
        fullWidth
        variant="outlined"
        onClick={onSuggestChange}
        sx={{
          flex: 1,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 900,
          fontSize: 14,
          py: 1.2,
          borderColor: alpha(m.navy, 0.14),
          color: alpha(m.navy, 0.72),
          bgcolor: "#fff",
          "&:hover": { bgcolor: alpha(m.navy, 0.04), borderColor: alpha(m.navy, 0.22) },
        }}
      >
        Suggest Change
      </Button>
      <Button
        fullWidth
        variant="contained"
        disableElevation
        startIcon={<CloseRoundedIcon />}
        onClick={onReject}
        sx={{
          flex: 1,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 900,
          fontSize: 14,
          py: 1.2,
          bgcolor: "#E85D5D",
          "&:hover": { bgcolor: "#D94545" },
        }}
      >
        Reject
      </Button>
    </Stack>
  );
}
