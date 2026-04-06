"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Container, Stack, Typography } from "@mui/material";

type FooterLink = {
  label: string;
  href: string;
};

type AppFooterProps = {
  brand?: string;
  links?: FooterLink[];
  caption?: string;
};

export default function AppFooter({
  brand = "Mollure",
  caption = "Built for polished experiences and scalable product flows.",
  links = [],
}: AppFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        borderTop: "1px solid rgba(16, 35, 63, 0.08)",
        background:
          "linear-gradient(180deg, rgba(245,247,251,0.2) 0%, rgba(228,246,250,0.7) 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#10233f", letterSpacing: "-0.03em" }}>
              {brand}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {caption}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {links.map((link) => (
              <Typography
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: "#10233f",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
