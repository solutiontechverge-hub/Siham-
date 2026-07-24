"use client";

import * as React from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { IconButton, InputAdornment, type TextFieldProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppTextField from "./AppTextField";

type AppSearchFieldProps = Omit<TextFieldProps, "type"> & {
  onClear?: () => void;
};

export default function AppSearchField({
  onClear,
  value,
  InputProps,
  sx,
  size = "small",
  ...props
}: AppSearchFieldProps) {
  const m = useTheme().palette.mollure;
  const hasValue =
    typeof value === "string" ? value.length > 0 : Boolean(value);

  return (
    <AppTextField
      // Use text (not search) so the browser native clear X doesn't
      // appear alongside our custom clear adornment.
      type="text"
      size={size}
      value={value}
      placeholder="Search..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon
              sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }}
            />
          </InputAdornment>
        ),
        endAdornment:
          hasValue && onClear ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="Clear search"
                edge="end"
                size="small"
                onClick={onClear}
              >
                <ClearRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        ...InputProps,
      }}
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
