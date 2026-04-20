"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type AppSegmentTab = { id: string; label: string };

export default function AppSegmentTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly AppSegmentTab[];
  value: string;
  onChange: (id: string) => void;
}) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: `1px solid ${tokens.border}`,
        borderRadius: 999,
        overflow: "hidden",
        width: "100%",
        maxWidth: 760,
      }}
    >
      <Stack direction="row" sx={{ width: "100%" }}>
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <Box
              key={t.id}
              role="button"
              tabIndex={0}
              aria-label={t.label}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onChange(t.id);
              }}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1.15,
                fontWeight: 800,
                fontSize: 13.5,
                color: active ? "#fff" : tokens.slate,
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

