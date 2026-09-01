"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Container, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";

export type ClientTopTab = {
  label: string;
  href: string;
};

export const CLIENT_TOP_TABS: readonly ClientTopTab[] = [
  { label: "Profile", href: "/clients/profile" },
  { label: "Booking", href: "/clients/booking" },
  { label: "Favorites", href: "/clients/favourites" },
];

export function clientTopTabsActiveLabel(
  pathname: string | null | undefined,
): string {
  if (pathname?.includes("/clients/favourites")) return "Favorites";
  if (pathname?.includes("/clients/booking")) return "Booking";
  return "Profile";
}

export type ClientTopTabsProps = {
  tabs?: readonly ClientTopTab[];
  activeLabel: string;
};

export function ClientPageTabsBar({
  activeLabel,
  tabs = CLIENT_TOP_TABS,
}: {
  activeLabel: string;
  tabs?: readonly ClientTopTab[];
}) {
  return (
    <Box sx={{ mt: 2, bgcolor: "transparent" }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5 }}>
        <ClientTopTabs tabs={tabs} activeLabel={activeLabel} />
      </Container>
    </Box>
  );
}

export default function ClientTopTabs({
  tabs = CLIENT_TOP_TABS,
  activeLabel,
}: ClientTopTabsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: "8px",
        bgcolor: "#FFFFFF",
        backgroundImage: "none",
        border: "none",
        boxShadow: "none",
        px: 0,
        py: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={0}
        sx={{
          overflowX: "auto",
          position: "relative",
          bgcolor: "#FFFFFF",
          width: "100%",
          justifyContent: "space-between",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
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
                minWidth: { xs: 72, md: 0 },
                textAlign: "center",
                letterSpacing: "-0.01em",
                bgcolor: "#fff",
                "&:hover": { bgcolor: "#fff" },
                color: active
                  ? theme.palette.text.primary
                  : alpha(theme.palette.text.secondary, 0.75),
                fontSize: { xs: 13, sm: 14, md: 16 },
                pt: { xs: 1.25, md: 1.6 },
                pb: { xs: 1.2, md: 1.55 },
                fontWeight: active ? 700 : 500,
                position: "relative",
                zIndex: 1,
                borderRight: `1px solid ${alpha(m.navy, 0.14)}`,
                "&:last-of-type": { borderRight: "none" },
                "&:after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  bgcolor: active ? theme.palette.primary.main : "transparent",
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
