"use client";

import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";

export default function ClientBookingPage() {
  return (
    <Box sx={{ minHeight: "60vh", bgcolor: "#E6F7F8", py: 6 }}>
      <Container maxWidth="sm">
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
          Booking
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          This section will list your bookings.
        </Typography>
        <Link href="/client/profile">Back to Profile</Link>
      </Container>
    </Box>
  );
}
