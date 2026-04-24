"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Checkbox, MenuItem, type TextFieldProps } from "@mui/material";
import AppTextField from "./AppTextField";

export type AppDropdownOption = {
  label: string;
  value: string;
};

type AppDropdownProps = Omit<TextFieldProps, "select" | "onChange" | "children" | "value"> & {
  options: AppDropdownOption[];
  value: string | readonly string[];
  multiple?: boolean;
  renderValue?: (selected: string | readonly string[]) => React.ReactNode;
  onChange: (
    value: string | readonly string[],
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
};

export default function AppDropdown({
  onChange,
  options,
  value,
  multiple,
  renderValue,
  ...props
}: AppDropdownProps) {
  return (
    <AppTextField
      select
      value={value}
      onChange={(event) => onChange(event.target.value, event)}
      SelectProps={{
        IconComponent: ExpandMoreRoundedIcon,
        multiple: Boolean(multiple),
        renderValue: renderValue as any,
      }}
      {...props}
    >
      {options.map((option) => {
        const selected = Array.isArray(value) ? value.includes(option.value) : value === option.value;
        return (
          <MenuItem key={option.value} value={option.value} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {multiple ? <Checkbox size="small" checked={selected} /> : null}
            {option.label}
          </MenuItem>
        );
      })}
    </AppTextField>
  );
}
