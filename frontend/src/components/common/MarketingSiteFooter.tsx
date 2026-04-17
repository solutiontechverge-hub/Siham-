"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

export type MarketingFooterItem = string | { label: string; href?: string };

export type MarketingFooterColumn = {
  title: string;
  items: readonly MarketingFooterItem[];
};

export type MarketingSiteFooterProps = {
  columns: readonly MarketingFooterColumn[];
  copyright: string;
  /** Extra styles on the outer footer wrapper (e.g. `{ mt: 2 }` on professionals pages). */
  sx?: SxProps<Theme>;
};

const itemTypographySx = {
  color: "inherit",
  fontSize: 12.5,
  lineHeight: 1.65,
} as const;

function FooterItem({ item, muted }: { item: MarketingFooterItem; muted: string }) {
  const label = typeof item === "string" ? item : item.label;
  const href = typeof item === "object" && item.href ? item.href : undefined;

  if (href) {
    return (
      <Typography
        component={Link}
        href={href}
        sx={{
          ...itemTypographySx,
          color: muted,
          textDecoration: "none",
          "&:hover": { textDecoration: "underline", textDecorationColor: alpha("#fff", 0.35) },
        }}
      >
        {label}
      </Typography>
    );
  }

  return (
    <Typography sx={{ ...itemTypographySx, color: muted }}>
      {label}
    </Typography>
  );
}

/**
 * Shared marketing footer — layout and type match the professionals Features/Pricing footer.
 */
export default function MarketingSiteFooter({ columns, copyright, sx }: MarketingSiteFooterProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const muted = m.footerText;

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: m.footer,
        color: m.footerText,
        pt: 5.5,
        pb: 3,
        ...sx,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {columns.map((column, index) => (
            <Grid
              item
              xs={12}
              sm={index === 0 ? 12 : 6}
              md={index === 0 ? 5 : 2.33}
              key={column.title}
            >
              <Typography
                sx={{
                  mb: 1.25,
                  fontWeight: 900,
                  color: "#fff",
                  fontSize: index === 0 ? 22 : 14,
                }}
              >
                {column.title}
              </Typography>
              <Stack spacing={0.9}>
                {column.items.map((item, i) => {
                  const key = typeof item === "string" ? item : `${item.label}-${item.href ?? i}`;
                  if (index === 0 && typeof item === "string") {
                    return (
                      <Typography
                        key={key}
                        sx={{
                          color: muted,
                          lineHeight: 1.7,
                          maxWidth: 360,
                          fontSize: 13,
                        }}
                      >
                        {item}
                      </Typography>
                    );
                  }
                  return <FooterItem key={key} item={item} muted={muted} />;
                })}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 3.5, borderColor: alpha("#fff", 0.12) }} />
        <Typography sx={{ color: m.footerMuted, fontSize: 12.5 }}>
          {copyright}
        </Typography>
      </Container>
    </Box>
  );
}
