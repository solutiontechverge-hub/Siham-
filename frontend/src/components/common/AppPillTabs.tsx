"use client";

import AppButton from "./AppButton";
import * as React from "react";
import Link from "next/link";
import { Box } from "@mui/material";
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
  /** Left-aligned compact group (booking filters). Default true. */
  alignStart?: boolean;
};

export default function AppPillTabs({
  tabs,
  active,
  onChange,
  alignStart = true,
}: AppPillTabsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      sx={{
        width: alignStart ? "fit-content" : "100%",
        maxWidth: "100%",
        bgcolor: alpha(m.teal, 0.06),
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        p: 0.4,
        display: "inline-flex",
        gap: 0.5,
      }}
    >
      {tabs.map((t, index) => {
        const v = t.value ?? t.label;
        const isActive = v === active;
        const isFirst = index === 0;
        const isLast = index === tabs.length - 1;

        const tabSx = {
          textTransform: "none" as const,
          fontWeight: 800,
          fontSize: 13,
          borderRadius: isActive
            ? "8px"
            : isFirst
              ? "8px 4px 4px 8px"
              : isLast
                ? "4px 8px 8px 4px"
                : "6px",
          px: 2.75,
          py: 0.95,
          minHeight: 38,
          minWidth: 96,
          flex: alignStart ? "0 0 auto" : "1 1 0",
          bgcolor: isActive ? m.teal : "#fff",
          color: isActive ? "#fff" : alpha(m.navy, 0.62),
          border: isActive ? "none" : `1px solid ${alpha(m.navy, 0.06)}`,
          boxShadow: "none",
          "&:hover": {
            bgcolor: isActive ? m.tealDark : alpha(m.navy, 0.02),
          },
        };

        if (t.href) {
          return (
            <AppButton
              key={t.href}
              component={Link}
              href={t.href}
              disableElevation
              sx={tabSx}
            >
              {t.label}
            </AppButton>
          );
        }

        return (
          <AppButton
            key={v}
            onClick={() => onChange?.(v)}
            disableElevation
            sx={tabSx}
          >
            {t.label}
          </AppButton>
        );
      })}
    </Box>
  );
}
