"use client";

import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FixedLocationTopTabs, { type FixedLocationTopTab } from "./FixedLocationTopTabs";

export type FixedLocationPageScaffoldProps = {
  activeTopTab: string;
  topTabs: readonly FixedLocationTopTab[];
  children: React.ReactNode;
};

export default function FixedLocationPageScaffold({ activeTopTab, topTabs, children }: FixedLocationPageScaffoldProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box sx={{ bgcolor: alpha(m.teal, 0.08), minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack spacing={2}>
          <FixedLocationTopTabs tabs={topTabs} activeLabel={activeTopTab} />
          {children}
        </Stack>
      </Container>
    </Box>
  );
}

