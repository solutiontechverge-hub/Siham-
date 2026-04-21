"use client";

import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import Link from "next/link";

export type ClientFavouritesTab = {
  id: string;
  label: string;
  href: string;
};

export function ClientFavouritesTabs({
  tabs,
  activeId,
  borderColor,
  teal,
  slate,
}: {
  tabs: readonly ClientFavouritesTab[];
  activeId: string;
  borderColor: string;
  teal: string;
  slate: string;
}) {
  return (
    <Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${borderColor}` }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="center" spacing={{ xs: 4, sm: 8 }}>
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <Box
                key={tab.id}
                component={Link}
                href={tab.href}
                sx={{
                  py: 1.75,
                  textDecoration: "none",
                  color: active ? "#000" : slate,
                  fontWeight: active ? 700 : 600,
                  fontSize: 15,
                  borderBottom: active ? `3px solid ${teal}` : "3px solid transparent",
                  mb: "-1px",
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}

