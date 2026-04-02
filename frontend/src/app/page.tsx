"use client";

import * as React from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

export default function HomePage() {
  const [apiStatus, setApiStatus] = React.useState("Check backend status");

  const checkBackend = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/health");
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
          <Typography variant="body2">{apiStatus}</Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
