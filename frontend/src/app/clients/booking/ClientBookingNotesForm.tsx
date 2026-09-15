"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import { AppTextField } from "../../../components/common";

export type ClientBookingNotesFormProps = {
  clientNote: string;
  setClientNote: (value: string) => void;
};

export default function ClientBookingNotesForm({
  clientNote,
  setClientNote,
}: ClientBookingNotesFormProps) {
  const m = useTheme().palette.mollure;

  const planningFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: alpha(m.navy, 0.015),
      fontSize: 12,
      fontWeight: 700,
      "& fieldset": { borderColor: alpha(m.navy, 0.08) },
    },
    "& .MuiOutlinedInput-input": {
      color: alpha(m.navy, 0.55),
    },
  };

  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        p: 1.5,
        borderRadius: "10px",
        bgcolor: "#fff",
      }}
    >
      <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
        Note
      </Typography>
      <AppTextField
        value={clientNote}
        onChange={(e) => setClientNote(e.target.value)}
        placeholder="Write a note for the professional…"
        fullWidth
        multiline
        minRows={4}
        sx={planningFieldSx}
      />
    </Box>
  );
}
