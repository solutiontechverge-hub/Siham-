"use client";

import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DesiredLocationTopTabs, { type DesiredLocationTopTab } from "./DesiredLocationTopTabs";

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
    </Box>
  );
}

