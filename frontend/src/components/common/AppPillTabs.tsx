"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Button } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type AppPillTab = {
  label: string;
  value?: string;
  href?: string;
};

export type AppPillTabsProps = {
  tabs: readonly AppPillTab[];
  active: string;
  onChange?: (next: string) => void;
};

export default function AppPillTabs({ tabs, active, onChange }: AppPillTabsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const tabSx = (isActive: boolean) => ({
    textTransform: "none" as const,
    fontWeight: 800,
    fontSize: 13.5,
    borderRadius: "10px",
    px: 2.5,
    py: 1.05,
    minHeight: 42,
    flex: "1 1 0",
    bgcolor: isActive ? m.teal : m.fxSurface,
    color: isActive ? m.fxSurface : alpha(m.navy, 0.62),
    boxShadow: "none",
    "&:hover": { bgcolor: isActive ? m.tealDark : alpha(m.navy, 0.03) },
  });

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: m.fxPillTrack,
        borderRadius: "10px",
        border: `1px solid ${m.fxPillBorder}`,
        p: 0.5,
        display: "flex",
        gap: 0.75,
      }}
    >
      {tabs.map((t) => {
        const v = t.value ?? t.label;
        const isActive = v === active;

        if (t.href) {
          return (
            <Button
              key={t.href}
              component={Link}
              href={t.href}
              disableElevation
              sx={tabSx(isActive)}
            >
              {t.label}
            </Button>
          );
        }

        return (
          <Button
            key={v}
            onClick={() => onChange?.(v)}
            disableElevation
            sx={tabSx(isActive)}
          >
            {t.label}
          </Button>
        );
      })}
    </Box>
  );
}

