"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type AdminTimeRange = "today" | "7d" | "30d" | "year" | "custom";

const TIME_RANGE_TABS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "year", label: "This Year" },
  { id: "custom", label: "Custom Range" },
] as const;

type AdminTimeRangeFilterProps = {
  value: AdminTimeRange;
  onChange: (value: AdminTimeRange) => void;
};

export default function AdminTimeRangeFilter({ value, onChange }: AdminTimeRangeFilterProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Box
      sx={{
        bgcolor: tokens.white,
        border: `1px solid ${tokens.border}`,
        borderRadius: 999,
        overflowX: "auto",
        width: "100%",
      }}
    >
      <Stack direction="row" sx={{ minWidth: { xs: 520, sm: "100%" } }}>
        {TIME_RANGE_TABS.map((t) => {
          const active = t.id === value;
          return (
            <Box
              key={t.id}
              role="button"
              tabIndex={0}
              aria-label={t.label}
              onClick={() => onChange(t.id as AdminTimeRange)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onChange(t.id as AdminTimeRange);
              }}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1.15,
                px: 1.5,
                whiteSpace: "nowrap",
                fontWeight: active ? 700 : 600,
                fontSize: { xs: 12, sm: 13.5 },
                color: active ? tokens.white : tokens.slate,
                bgcolor: active ? tokens.teal : "transparent",
                cursor: "pointer",
                userSelect: "none",
                transition: "background-color 160ms ease, color 160ms ease",
              }}
            >
              {t.label}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
