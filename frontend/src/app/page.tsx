"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { apiUrl } from "../lib/api";

export default function HomePage() {
  const [apiStatus, setApiStatus] = React.useState("Check backend status");

  const checkBackend = async () => {
    try {
      const res = await fetch(apiUrl("/api/health"));
      const data = await res.json();
      setApiStatus(data?.message || "Backend response mil gaya.");
    } catch (_error) {
      setApiStatus("Backend connect nahi ho raha. Backend run karke dobara try karein.");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Next.js + MUI Frontend Ready
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Yeh frontend MUI ke sath configured hai aur backend health API ko hit kar sakta hai.
          </Typography>
          <Box>
            <Button variant="contained" onClick={checkBackend}>
              Check Backend API
            </Button>
          </Box>
          <Box>
            <Button component={Link} href="/auth/forgot-password" variant="outlined">
              Open Forgot Password Page
            </Button>
          </Box>
          <Box>
            <Button component={Link} href="/auth/signup/company" variant="outlined">
              Open Company Signup Page
            </Button>
          </Box>
          <Box>
            <Button component={Link} href="/auth/signup/individual" variant="outlined">
              Open Individual Signup Page
            </Button>
          </Box>
          <Box>
            <Button component={Link} href="/auth/signup/professional" variant="outlined">
              Open Professional Signup Page
            </Button>
          </Box>
          <Box>
            <Button component={Link} href="/auth/login" variant="outlined">
              Open Login Page
            </Button>
          </Box>
          <Box>
            <Button component={Link} href="/auth/reset-password/verify-otp" variant="outlined">
              Open Verify OTP Page
            </Button>
          </Box>
          <Typography variant="body2">{apiStatus}</Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
