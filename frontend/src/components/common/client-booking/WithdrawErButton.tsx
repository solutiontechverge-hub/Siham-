"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import AppButton from "../AppButton";

type Props = {
  onClick: () => void;
  isLoading?: boolean;
};

/** Full-width soft outline — same shell as Cancel Booking. */
export default function WithdrawErButton({ onClick, isLoading }: Props) {
  const m = useTheme().palette.mollure;
  return (
    <AppButton
      fullWidth
      variant="outlined"
      isLoading={isLoading}
      startIcon={<CloseRoundedIcon sx={{ fontSize: 18 }} />}
      onClick={onClick}
      sx={{
        ...mollureLabelSx(m.navy, {
          color: alpha(m.navy, 0.55),
        }),
        borderRadius: "10px",
        textTransform: "none",
        height: 40,
        borderColor: alpha(m.navy, 0.12),
        bgcolor: alpha(m.navy, 0.03),
        "&:hover": {
          bgcolor: alpha(m.navy, 0.06),
          borderColor: alpha(m.navy, 0.18),
        },
      }}
    >
      Withdraw ER
    </AppButton>
  );
}
