"use client";

import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import FixedLocationTopTabs, {
  type FixedLocationTopTab,
} from "./FixedLocationTopTabs";
import MarketingSiteFooter from "./MarketingSiteFooter";
import {
  stickyFooterAnchorSx,
  stickyFooterGrowSx,
} from "./StickyFooterPageShell";
import { professionalsMarketingFooter } from "../../data/marketingShell.data";

export type FixedLocationPageScaffoldProps = {
  activeTopTab: string;
  topTabs: readonly FixedLocationTopTab[];
  children: React.ReactNode;
};

export default function FixedLocationPageScaffold({
  activeTopTab,
  topTabs,
  children,
}: FixedLocationPageScaffoldProps) {
  return (
    <Box sx={{ ...stickyFooterGrowSx, bgcolor: "mollure.pageBg" }}>
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Stack spacing={2}>
            <FixedLocationTopTabs tabs={topTabs} activeLabel={activeTopTab} />
            {children}
          </Stack>
        </Container>
      </Box>

      <MarketingSiteFooter
        columns={professionalsMarketingFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={professionalsMarketingFooter.copyright}
        sx={stickyFooterAnchorSx}
      />
    </Box>
  );
}
