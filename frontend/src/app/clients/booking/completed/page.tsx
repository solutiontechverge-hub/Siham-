"use client";

import AppButton from "../../../../components/common/AppButton";
import * as React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter, useSearchParams } from "next/navigation";

const REDIRECT_SECONDS = 30;

export default function BookingCompletedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const m = theme.palette.mollure;
  const outcome = searchParams?.get("outcome") === "requested" ? "requested" : "completed";
  const title =
    outcome === "requested" ? "Booking Request sent" : "Booking Completed";
  const [secondsLeft, setSecondsLeft] = React.useState(REDIRECT_SECONDS);

  React.useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  React.useEffect(() => {
    if (secondsLeft > 0) return;
    router.replace("/clients/booking");
  }, [router, secondsLeft]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "mollure.pageBg",
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
              <Typography
                sx={{
                  fontWeight: 900,
                  color: alpha(m.navy, 0.82),
                  fontSize: 16,
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: alpha(m.navy, 0.45),
                  fontSize: 12.5,
                }}
              >
                Redirecting to bookings in {secondsLeft}s
              </Typography>
              <AppButton
                tone="primary"
                onClick={() => router.push("/clients/booking")}
                sx={{ mt: 0.5, borderRadius: "8px" }}
              >
                View Booking
              </AppButton>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
