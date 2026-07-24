"use client";

import AppButton from "../AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type BookingRequestResponseActionsProps = {
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
};

export default function BookingRequestResponseActions({
  onAccept,
  onEdit,
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
          flex: 1,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 900,
          fontSize: 13,
          py: 1.1,
          bgcolor: m.success,
          "&:hover": { bgcolor: m.successDark },
        }}
      >
        Accept
      </AppButton>
      <AppButton
        fullWidth
        variant="outlined"
        startIcon={<EditRoundedIcon sx={{ fontSize: 18 }} />}
        onClick={onEdit}
        sx={{
          flex: 1,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 900,
          fontSize: 13,
          py: 1.1,
          borderColor: alpha(m.navy, 0.14),
          color: alpha(m.navy, 0.68),
          bgcolor: alpha(m.navy, 0.03),
          "&:hover": {
            bgcolor: alpha(m.navy, 0.06),
            borderColor: alpha(m.navy, 0.2),
          },
        }}
      >
        Edit
      </AppButton>
      <AppButton
        tone="danger"
        fullWidth
        startIcon={<CloseRoundedIcon />}
        onClick={onReject}
        sx={{
          flex: 1,
          py: 1.1,
          "&:hover": { bgcolor: "#D94545" },
        }}
      >
        Reject
      </AppButton>
    </Stack>
  );
}
