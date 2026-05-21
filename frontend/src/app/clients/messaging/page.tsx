"use client";

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { MessagingPageShell } from "../../../components/common/messaging";

function MessagingFallback() {
  return (
    <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <CircularProgress size={28} />
    </Box>
  );
}

export default function ClientMessagingPage() {
  return (
    <Suspense fallback={<MessagingFallback />}>
      <MessagingPageShell audience="client" />
    </Suspense>
  );
}
