"use client";

import * as React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";

export default function BookingCompletedPage() {
  const router = useRouter();
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#EAF9FB",
        py: { xs: 2.5, md: 3.5 },
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
            minHeight: { xs: 360, md: 460 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Box sx={{ px: 3 }}>
            <Stack spacing={1.6} alignItems="center">
              <Box
                sx={{
                  width: 62,
                  height: 62,
                  borderRadius: "999px",
                  border: `2px solid ${m.teal}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: m.teal,
                }}
              >
                <CheckRoundedIcon sx={{ fontSize: 34 }} />
              </Box>
              <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.82), fontSize: 16 }}>
                Booking Completed
              </Typography>
              <Button
                variant="contained"
                disableElevation
                onClick={() => router.push("/clients/booking")}
                sx={{ mt: 0.5, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark }, borderRadius: "8px", fontWeight: 900, textTransform: "none" }}
              >
                View Booking
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

