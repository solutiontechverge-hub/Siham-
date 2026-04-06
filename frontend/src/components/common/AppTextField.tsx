"use client";

import * as React from "react";
import { TextField, type TextFieldProps } from "@mui/material";

export default function AppTextField(props: TextFieldProps) {
  return (
    <TextField
      fullWidth
      InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
      {...props}
    />
  );
}
