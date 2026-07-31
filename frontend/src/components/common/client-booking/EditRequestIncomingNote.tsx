"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  note: string;
  /** Who wrote the ER note (the other party / sender). */
  from: "professional" | "client";
};

/** Incoming Confirmed ER note — shown only on the receiver side, above Accept/Reject. */
export default function EditRequestIncomingNote({ note, from }: Props) {
  const m = useTheme().palette.mollure;
  const trimmed = note.trim();
  if (!trimmed) return null;

  const label =
    from === "professional" ? "Note from professional" : "Note from client";

  return (
    <Box
      sx={{
        mt: 2,
        px: 1.75,
        py: 1.35,
        borderRadius: "10px",
        border: `1px solid ${alpha(m.teal, 0.28)}`,
        bgcolor: alpha(m.teal, 0.06),
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 0.2,
          color: alpha(m.navy, 0.55),
          mb: 0.45,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: alpha(m.navy, 0.82),
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {trimmed}
      </Typography>
    </Box>
  );
}
