"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Dense − qty + control used by booking/catalog rows. */
export default function QtyStepper({
  value,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled,
  stopPropagation,
  valueWidth = 24,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  stopPropagation?: boolean;
  valueWidth?: number;
}) {
  const m = useTheme().palette.mollure;
  const btnSx = {
    width: 30,
    height: 30,
    borderRadius: 0,
    color: alpha(m.navy, 0.55),
    "&:hover": { bgcolor: m.addSoftBgHover },
    "&.Mui-disabled": { color: alpha(m.navy, 0.35) },
  } as const;

  return (
    <Stack
      direction="row"
      alignItems="center"
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      sx={{
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        borderRadius: "8px",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <IconButton
        size="small"
        disabled={decrementDisabled}
        onClick={onDecrement}
        sx={btnSx}
      >
        <RemoveRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <Typography
        component="span"
        sx={{
          width: valueWidth,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 900,
          color: alpha(m.navy, 0.78),
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        disabled={incrementDisabled}
        onClick={onIncrement}
        sx={btnSx}
      >
        <AddRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}
