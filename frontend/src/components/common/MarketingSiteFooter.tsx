"use client";

import * as React from "react";
import { Box, Container, Divider, Grid, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BodyText, CardTitle } from "../ui/typography";

export type MarketingFooterColumn = {
  title: string;
  items: string[];
};

export type MarketingSiteFooterProps = {
  columns: MarketingFooterColumn[];
  copyright: string;
};

export default function MarketingSiteFooter({
  columns,
  copyright,
}: MarketingSiteFooterProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      component="footer"
      sx={{ bgcolor: m.footer, color: m.footerText, pt: 6, pb: 3 }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {columns.map((column, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={index === 0 ? 4 : 2}
              key={column.title}
            >
              <CardTitle sx={{ mb: 1.6, color: "#fff" }}>
                {column.title}
              </CardTitle>
              <Stack spacing={1.15}>
                {column.items.map((item) => (
                  <BodyText
                    key={item}
                    sx={{ color: m.footerText, lineHeight: 1.8 }}
                  >
                    {item}
                  </BodyText>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 3.5, borderColor: "rgba(255,255,255,0.08)" }} />
        <BodyText sx={{ color: m.footerMuted, fontSize: 13 }}>
          {copyright}
        </BodyText>
      </Container>
    </Box>
  );
}
