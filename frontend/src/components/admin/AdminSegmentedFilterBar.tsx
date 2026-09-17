"use client";

import * as React from "react";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  Box,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  mollureLabelSx,
  mollureBodyMutedSx,
} from "../../theme/mollureHierarchy";

export const ADMIN_FLUSHED_FIELD_SX: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 0,
    height: 40,
    bgcolor: "transparent",
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused fieldset": { border: "none" },
  },
  "& .MuiInputBase-input": {
    fontSize: 12,
    py: 0,
  },
  "& .MuiSelect-select": {
    fontSize: 12,
    py: "10px !important",
  },
};

export type AdminFilterSegmentConfig = {
  id: string;
  label: string;
  flex?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  minWidth?: number | string | Record<string, number | string>;
  content: React.ReactNode;
};

type AdminSegmentedFilterBarProps = {
  onReset?: () => void;
  resetLabel?: string;
  segments: AdminFilterSegmentConfig[];
};

export default function AdminSegmentedFilterBar({
  onReset,
  resetLabel = "Reset Filters",
  segments,
}: AdminSegmentedFilterBarProps) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      spacing={{ xs: 1.5, lg: 1.25 }}
      alignItems={{ lg: "flex-end" }}
    >
      <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="flex-end"
          sx={{
            display: { xs: "none", lg: "flex" },
            gap: 0,
            "& > *": { px: 1.5 },
            "& > *:first-of-type": { pl: 0 },
          }}
        >
          {segments.map((segment) => (
            <Box
              key={segment.id}
              sx={{ flex: segment.flex ?? 1, minWidth: segment.minWidth ?? 0 }}
            >
              <Typography
                sx={mollureBodyMutedSx(tokens.navy, {
                  fontSize: 11,
                  fontWeight: 600,
                  color: tokens.slate,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                })}
              >
                {segment.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          sx={{
            border: `1px solid ${tokens.inputBorder ?? tokens.cardBorder}`,
            borderRadius: 2.5,
            overflow: "hidden",
            bgcolor: tokens.white,
            boxShadow: "0 1px 2px rgba(16, 35, 63, 0.04)",
          }}
        >
          {segments.map((segment, index) => (
            <Box
              key={segment.id}
              sx={{
                flex: segment.flex ?? 1,
                minWidth: segment.minWidth ?? 0,
                display: "flex",
                flexDirection: "column",
                borderTop: {
                  xs: index > 0 ? `1px solid ${tokens.cardBorder}` : "none",
                  lg: "none",
                },
                borderLeft: {
                  xs: "none",
                  lg: index > 0 ? `1px solid ${tokens.cardBorder}` : "none",
                },
              }}
            >
              <Box
                sx={{
                  display: { xs: "flex", lg: "none" },
                  alignItems: "center",
                  px: 1.5,
                  py: 0.75,
                  bgcolor: tokens.surface,
                  borderBottom: `1px solid ${tokens.cardBorder}`,
                }}
              >
                <Typography
                  sx={mollureBodyMutedSx(tokens.navy, {
                    fontSize: 11,
                    fontWeight: 600,
                    color: tokens.slate,
                  })}
                >
                  {segment.label}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "stretch",
                  height: 40,
                }}
              >
                {segment.content}
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>

      {onReset ? (
        <Typography
          component="button"
          type="button"
          onClick={onReset}
          sx={mollureLabelSx(tokens.navy, {
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontWeight: 600,
            color: tokens.teal,
            p: 0,
            whiteSpace: "nowrap",
            alignSelf: { xs: "flex-start", lg: "flex-end" },
            mb: { lg: 0.85 },
            "&:hover": { textDecoration: "underline" },
          })}
        >
          <RefreshOutlinedIcon sx={{ fontSize: 16 }} />
          {resetLabel}
        </Typography>
      ) : null}
    </Stack>
  );
}
