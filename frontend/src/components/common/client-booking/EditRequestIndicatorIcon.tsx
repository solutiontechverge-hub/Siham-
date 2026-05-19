"use client";

import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SouthEastRoundedIcon from "@mui/icons-material/SouthEastRounded";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Variant = "arrow" | "rejected";

export default function EditRequestIndicatorIcon({ variant, size = 22 }: { variant: Variant; size?: number }) {
  const m = useTheme().palette.mollure;

  if (variant === "rejected") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: "#fff",
          border: `1px solid ${alpha("#E53935", 0.35)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CancelRoundedIcon sx={{ fontSize: size - 6, color: "#E53935" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: alpha(m.navy, 0.45),
      }}
    >
      <SouthEastRoundedIcon sx={{ fontSize: size - 2 }} />
    </Box>
  );
}
