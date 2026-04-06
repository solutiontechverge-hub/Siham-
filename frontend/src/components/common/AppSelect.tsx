"use client";

import * as React from "react";
import { MenuItem, type TextFieldProps } from "@mui/material";
import AppTextField from "./AppTextField";

export type AppSelectOption = {
  label: string;
  value: string | number;
};

type AppSelectProps = Omit<TextFieldProps, "select" | "children"> & {
  options: AppSelectOption[];
};

export default function AppSelect({ options, ...props }: AppSelectProps) {
  return (
    <AppTextField select {...props}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </AppTextField>
  );
}
