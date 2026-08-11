"use client";

import * as React from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  ClientBookingCreateSummaryView,
  ClientBookingDetailsView,
} from "../../../../components/common/client-booking";
import { getActiveBookingSession } from "../clientBookingSession";

/** Non-prepaid checkout – draft review or full booking details. */
export default function ClientBookingCheckoutPage() {
  const [view, setView] = React.useState<"loading" | "draft" | "details">(
    "loading",
  );

  React.useEffect(() => {
    const session = getActiveBookingSession();
    const isDraft =
      session?.status === "draft" && !session.bookingRequestSent;
    setView(isDraft ? "draft" : "details");
  }, []);

  if (view === "loading") {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (view === "draft") {
    return <ClientBookingCreateSummaryView />;
  }

  return <ClientBookingDetailsView variant="standard" />;
}
