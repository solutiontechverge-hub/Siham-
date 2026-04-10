"use client";

import * as React from "react";
import Link from "next/link";
import { Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type FixedLocationTopTab = {
  label: string;
  href: string;
};

export type FixedLocationTopTabsProps = {
  tabs: readonly FixedLocationTopTab[];
  activeLabel: string;
};

export default function FixedLocationTopTabs({
  tabs,
  activeLabel,
}: FixedLocationTopTabsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        ml: 0,
        mr: 0,
        borderRadius: "10px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        px: { xs: 1.75, md: 2.25 },
        py: 0.6,
      }}
    >
      <Stack
        direction="row"
        spacing={0}
        sx={{
          overflowX: "hidden",
          position: "relative",
          pt: 0.15,
          width: "100%",
          justifyContent: "space-between",

          // ✅ Hide scrollbar (Chrome, Safari, Edge)
          "&::-webkit-scrollbar": {
            display: "none",
          },

          // ✅ Hide scrollbar (Firefox)
          scrollbarWidth: "none",

          // ✅ Hide scrollbar (IE/Edge legacy)
          msOverflowStyle: "none",

          "&:after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            bgcolor: m.border,
          },
        }}
      >
        {tabs.map((t) => {
          const active = t.label === activeLabel;

          return (
            <Typography
              key={t.href}
              component={Link}
              href={t.href}
              sx={{
                textDecoration: "none",
                whiteSpace: "nowrap",
                flex: "1 1 0",
                textAlign: "center",
                fontWeight: active ? 500 : 400,
                letterSpacing: "-0.01em",
                color: active
                  ? theme.palette.text.primary
                  : alpha(theme.palette.text.secondary, 0.75),
                fontSize: 14,
                pt: 1.05,
                pb: 1.1,
                position: "relative",
                zIndex: 1,

                "&:after": {
                  content: '""',
                  position: "absolute",
                  left: "10%",
                  right: "10%",
                  bottom: -0.5,
                  height: 2,
                  bgcolor: active
                    ? theme.palette.primary.main
                    : "transparent",
                  borderRadius: 999,
                },
              }}
            >
              {t.label}
            </Typography>
          );
        })}
      </Stack>
    </Paper>
  );
}