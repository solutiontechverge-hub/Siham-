"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "grid", placeItems: "center", py: 6 }}>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: theme.palette.text.primary }}>
            Something went wrong
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14, lineHeight: 1.7 }}>
            {error?.message || "An unexpected error occurred."}
          </Typography>
          <Stack direction="row" spacing={1.25} justifyContent="center">
            <Button variant="contained" disableElevation onClick={reset} sx={{ textTransform: "none", fontWeight: 700 }}>
              Try again
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Go home
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

