"use client";

import * as React from "react";
import { Box, Button, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "../../../images";

export default function AboutPage() {
  const tokens = useTheme().palette.mollure;

  return (
    <Box sx={{ bgcolor: tokens.surface, color: tokens.navy, minHeight: "100vh" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: tokens.whiteOverlay,
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={3.5}>
              <Box component={Link} href="/" sx={{ display: "inline-flex", alignItems: "center" }}>
                <Image src={Logo} alt="Mollure" width={150} height={36} priority />
              </Box>
              <Stack direction="row" spacing={2.5} sx={{ display: { xs: "none", md: "flex" } }}>
                {[
                  { label: "Features", href: "/features" },
                  { label: "How It Works", href: "/how-it-works" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "About", href: "/about" },
                ].map((item) => {
                  const active = item.href === "/about";
                  return (
                    <Typography
                      key={item.href}
                      component={Link}
                      href={item.href}
                      sx={{
                        fontSize: 13,
                        fontWeight: active ? 800 : 700,
                        color: active ? tokens.navy : alpha(tokens.navy, 0.75),
                        textDecoration: "none",
                        "&:hover": { color: tokens.navy },
                      }}
                    >
                      {item.label}
                    </Typography>
                  );
                })}
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.1}>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                disableElevation
                sx={{
                  borderRadius: 999,
                  px: 2.4,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: tokens.teal,
                  "&:hover": { bgcolor: tokens.tealDark },
                  height: 34,
                }}
              >
                Login
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ bgcolor: tokens.heroGradientEnd, borderBottom: `1px solid ${tokens.border}` }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6.5, md: 8.5 } }}>
          <Stack alignItems="center" textAlign="center">
            <Typography
              component="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.04em",
                fontSize: { xs: "2.5rem", md: "4rem" },
                color: tokens.navy,
              }}
            >
              About
            </Typography>
            <Typography
              sx={{
                mt: 2.25,
                maxWidth: 900,
                color: alpha(tokens.navy, 0.62),
                fontSize: { xs: 14, md: 15.5 },
                lineHeight: 1.85,
              }}
            >
              About content will be added here. This page exists so the navbar link doesn’t 404.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ bgcolor: tokens.footer, color: tokens.footerText, pt: 6, pb: 3, mt: 2 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ mb: 1.6, fontWeight: 900, color: "#fff" }}>Mollure</Typography>
              <Typography sx={{ color: tokens.footerText, lineHeight: 1.8, maxWidth: 340 }}>
                The all-in-one platform for salon and freelance appointment management.
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3.5, borderColor: "rgba(255,255,255,0.08)" }} />
          <Typography sx={{ color: tokens.footerMuted, fontSize: 13 }}>
            2026 Mollure. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

