"use client";

import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

const teal = "#26b5bf";

export default function ProfessionalsPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fcfc" }}>
      <Box
        component="header"
        sx={{ bgcolor: "#fff", borderBottom: "1px solid #eaecf0", py: 2 }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography component={Link} href="/" sx={{ fontWeight: 700, color: "#475467", textDecoration: "none" }}>
              Mollure
            </Typography>
            <Button component={Link} href="/clients" sx={{ textTransform: "none", color: teal }}>
              For clients
            </Button>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: "#1d2939" }}>
          Professionals
        </Typography>
        <Typography sx={{ color: "#667085", mb: 3 }}>
          Professional landing content goes here. This page is standalone (no shared layout component).
        </Typography>
        <Button component={Link} href="/signup" variant="contained" sx={{ bgcolor: teal, textTransform: "none" }}>
          Get started
        </Button>
      </Container>
    </Box>
  );
}
