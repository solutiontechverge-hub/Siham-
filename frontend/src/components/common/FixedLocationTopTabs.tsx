"use client";

import * as React from "react";
import Link from "next/link";
import { Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

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
        borderRadius: "8px",
        bgcolor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        backgroundImage: "none",
        opacity: 1,
        filter: "none",
        border: `1px solid ${alpha(m.navy, 0.10)}`,
        boxShadow: "none",
        px: 0,
        py: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={0}
        sx={{
          overflowX: "hidden",
          position: "relative",
          bgcolor: "#FFFFFF",
          backgroundColor: "#FFFFFF",
          backgroundImage: "none",
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
            bgcolor: alpha(m.navy, 0.16),
          },
        }}
      >
        {tabs.map((t) => {
          const active = t.label === activeLabel;

          return (
            <BodyText
              key={t.href}
              component={Link}
              href={t.href}
              sx={{
                textDecoration: "none",
                whiteSpace: "nowrap",
                flex: "1 1 0",
                textAlign: "center",
                letterSpacing: "-0.01em",
                color: active
                  ? theme.palette.text.primary
                  : alpha(theme.palette.text.secondary, 0.75),
                fontSize: 14,
                pt: 1.2,
                pb: 1.15,
                fontWeight: active ? 600 : 400,
                position: "relative",
                zIndex: 1,

                "&:after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  bgcolor: active
                    ? theme.palette.primary.main
                    : "transparent",
                  borderRadius: 0,
                },
              }}
            >
              {t.label}
            </BodyText>
          );
        })}
      </Stack>
    </Paper>
  );
}