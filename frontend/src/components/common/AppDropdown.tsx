"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { MenuItem, type TextFieldProps } from "@mui/material";
import AppTextField from "./AppTextField";

export type AppDropdownOption = {
  label: string;
  value: string;
};

type AppDropdownProps = Omit<TextFieldProps, "select" | "onChange" | "children"> & {
  options: AppDropdownOption[];
  value: string;
  onChange: (
    value: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
};

export default function AppDropdown({
  onChange,
  options,
  value,
  ...props
}: AppDropdownProps) {
  return (
    <AppTextField
      select
      value={value}
      onChange={(event) => onChange(event.target.value, event)}
      SelectProps={{
        IconComponent: ExpandMoreRoundedIcon,
      }}
      {...props}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </AppTextField>
  );
}
