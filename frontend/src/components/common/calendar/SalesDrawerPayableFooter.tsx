"use client";

import * as React from "react";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { useBookingFinance } from "../booking-finance/useBookingFinance";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { buildSalesPayableSummary } from "./buildSalesPayableSummary";
import SalesPayableBar from "./SalesPayableBar";

type SalesDrawerPayableFooterProps = {
  viewingBookingEvent: CalendarEvent | null;
};

/** Drawer footer for Sales tab — live ledger payable breakdown. */
export default function SalesDrawerPayableFooter({
  viewingBookingEvent,
}: SalesDrawerPayableFooterProps) {
  const parsed = viewingBookingEvent
    ? parseApiCalendarEventId(viewingBookingEvent.id)
    : null;
  const financeBookingId =
    viewingBookingEvent?.bookingCode ||
    (parsed?.kind === "booking" ? parsed.id : null) ||
    "";

  const { finance } = useBookingFinance(financeBookingId, {
    skip: !financeBookingId,
  });

  const summary = React.useMemo(
    () => buildSalesPayableSummary(finance),
    [finance],
  );

  if (!summary) return null;
  return <SalesPayableBar summary={summary} />;
}
