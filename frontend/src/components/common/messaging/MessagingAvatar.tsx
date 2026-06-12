"use client";

import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function MessagingAvatar({ seed, size = 40, src }: { seed: string; size?: number; src?: string }) {
  return (
    <Avatar
      src={src}
      sx={{
        width: size,
        height: size,
        fontWeight: 900,
        fontSize: size * 0.34,
        bgcolor: alpha("#285C70", 0.12),
        color: "#285C70",
      }}
    >
      {seed.slice(0, 2).toUpperCase()}
    </Avatar>
  );
}
