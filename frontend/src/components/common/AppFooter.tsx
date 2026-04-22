"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Container, Stack } from "@mui/material";
import { BodyText, CardTitle } from "../ui/typography";

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
            <CardTitle sx={{ color: "#10233f", letterSpacing: "-0.03em" }}>
              {brand}
            </CardTitle>
            <BodyText color="text.secondary" sx={{ mt: 0.75 }}>
              {caption}
            </BodyText>
          </Box>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {links.map((link) => (
              <BodyText
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: "#10233f",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </BodyText>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
