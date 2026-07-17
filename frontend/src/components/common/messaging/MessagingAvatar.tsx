"use client";

import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function MessagingAvatar({
  seed,
  label,
  size = 40,
  src,
}: {
  seed: string;
  label?: string;
  size?: number;
  src?: string;
}) {
  const initialsSource = (label ?? seed).trim() || seed;
  const initials = initialsSource
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
      {initials || seed.slice(0, 2).toUpperCase()}
    </Avatar>
  );
}
