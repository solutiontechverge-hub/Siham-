"use client";

import * as React from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { IconButton, InputAdornment, type TextFieldProps } from "@mui/material";
import AppTextField from "./AppTextField";

type AppSearchFieldProps = Omit<TextFieldProps, "type"> & {
  onClear?: () => void;
};

export default function AppSearchField({
  onClear,
  value,
  InputProps,
  ...props
}: AppSearchFieldProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

  return (
    <AppTextField
      type="search"
      value={value}
      placeholder="Search..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ color: "text.secondary" }} />
          </InputAdornment>
        ),
        endAdornment:
          hasValue && onClear ? (
            <InputAdornment position="end">
              <IconButton aria-label="Clear search" edge="end" onClick={onClear}>
                <ClearRoundedIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        ...InputProps,
      }}
      {...props}
    />
  );
}
