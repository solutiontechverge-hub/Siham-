"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useMessagingWidget } from "./MessagingWidgetContext";

function MessagingSpinner() {
  return (
    <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function MessagingRouteRedirectInner({ fallbackHref }: { fallbackHref: string }) {
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
    router.replace(fallbackHref);
  }, [fallbackHref, openMessaging, router, searchParams]);

  return <MessagingSpinner />;
}

/** Opens the floating messaging widget, then redirects off the dedicated messaging URL. */
export default function MessagingRouteRedirect({
  fallbackHref,
}: {
  fallbackHref: string;
}) {
  return (
    <Suspense fallback={<MessagingSpinner />}>
      <MessagingRouteRedirectInner fallbackHref={fallbackHref} />
    </Suspense>
  );
}
