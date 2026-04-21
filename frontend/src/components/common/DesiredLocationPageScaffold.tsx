"use client";

import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DesiredLocationTopTabs, { type DesiredLocationTopTab } from "./DesiredLocationTopTabs";
import MarketingSiteFooter from "./MarketingSiteFooter";
import { professionalsMarketingFooter } from "../../data/marketingShell.data";

export type DesiredLocationPageScaffoldProps = {
  activeTopTab: string;
  topTabs: readonly DesiredLocationTopTab[];
  children: React.ReactNode;
};

export default function DesiredLocationPageScaffold({
  activeTopTab,
  topTabs,
  children,
}: DesiredLocationPageScaffoldProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box sx={{ bgcolor: alpha(m.teal, 0.08), minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack spacing={2}>
          <DesiredLocationTopTabs tabs={topTabs} activeLabel={activeTopTab} />
          {children}
        </Stack>
      </Container>

      <MarketingSiteFooter
        columns={professionalsMarketingFooter.columns.map((col) => ({ title: col.title, items: [...col.items] }))}
        copyright={professionalsMarketingFooter.copyright}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}

