"use client";

import * as React from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/** Shared checkbox row for calendar / finance filter drawers. */
export function FilterDrawerCheckboxRow({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        margin: 0,
        padding: "2px 0",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        userSelect: "none",
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        disableRipple
        sx={{
          padding: 0,
          margin: 0,
          width: 18,
          height: 18,
          color: alpha(m.navy, 0.35),
          "&.Mui-checked": { color: m.teal },
          "& .MuiSvgIcon-root": { fontSize: 18 },
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: 12,
          lineHeight: "18px",
          fontWeight: 500,
          color: alpha(m.navy, 0.72),
          margin: 0,
          padding: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

/** Shared section title for calendar / finance filter drawers. */
export function FilterDrawerSectionHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Typography
      component="div"
      sx={{
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1.2,
        color: alpha(m.navy, 0.7),
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}
