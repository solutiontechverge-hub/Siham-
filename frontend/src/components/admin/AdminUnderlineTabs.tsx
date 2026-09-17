"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../theme/mollureHierarchy";

export type AdminUnderlineTab = { id: string; label: string };

type AdminUnderlineTabsProps = {
  tabs: readonly AdminUnderlineTab[];
  value: string;
  onChange: (id: string) => void;
  /** Use inside cards — removes extra bottom margin */
  embedded?: boolean;
};

export default function AdminUnderlineTabs({
  tabs,
  value,
  onChange,
  embedded = false,
}: AdminUnderlineTabsProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${tokens.cardBorder}`,
        mb: embedded ? 0 : 3,
      }}
    >
      <Stack direction="row" spacing={4} sx={{ px: 0.25 }}>
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <Box
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onChange(tab.id);
              }}
              sx={{
                pb: 1.5,
                cursor: "pointer",
                userSelect: "none",
                ...mollureLabelSx(tokens.navy, {
                  fontSize: 14,
                  fontWeight: active ? 800 : 600,
                  color: active ? tokens.tealDark : tokens.slate,
                }),
                borderBottom: `2px solid ${active ? tokens.teal : "transparent"}`,
                mb: "-1px",
                transition: "color 160ms ease, border-color 160ms ease",
                "&:hover": { color: active ? tokens.tealDark : tokens.navy },
              }}
            >
              {tab.label}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
