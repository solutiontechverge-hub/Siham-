"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useMessagingWidget } from "../../../components/common/messaging/MessagingWidgetContext";

function ClientMessagingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openMessaging } = useMessagingWidget();
  const openedRef = React.useRef(false);

  React.useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    openMessaging({
      bookingRef: searchParams.get("booking") ?? undefined,
      threadId: searchParams.get("thread") ?? undefined,
    });
    router.replace("/");
  }, [openMessaging, router, searchParams]);

  return (
    <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
      <CircularProgress size={28} />
    </Box>
  );
}

export default function ClientMessagingPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <ClientMessagingRedirect />
    </Suspense>
  );
}
