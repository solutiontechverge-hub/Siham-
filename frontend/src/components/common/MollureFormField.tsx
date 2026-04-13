"use client";

import * as React from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function MollureFormField(props: TextFieldProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const baseSx = React.useMemo(
    () => ({
      "& .MuiInputLabel-root": {
        fontSize: 11.5,
        fontWeight: 700,
        color: alpha(m.navy, 0.68),
      },
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        bgcolor: alpha(m.navy, 0.018),
        "& fieldset": { borderColor: alpha(m.navy, 0.14) },
        "&:hover fieldset": { borderColor: alpha(m.navy, 0.22) },
        "&.Mui-focused fieldset": {
          borderColor: alpha(m.teal, 0.55),
          borderWidth: 1,
        },
      },
      "& .MuiOutlinedInput-input": {
        fontSize: 12,
        color: alpha(m.navy, 0.86),
        paddingTop: "11px",
        paddingBottom: "11px",
      },
      "& textarea": { fontSize: 12, color: alpha(m.navy, 0.86) },
      "& input::placeholder": { color: alpha(m.navy, 0.45), opacity: 1 },
    }),
    [m.navy, m.teal],
  );

  return (
    <TextField
      fullWidth
      size="small"
      InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
      {...props}
      sx={[baseSx, props.sx] as any}
    />
  );
}

