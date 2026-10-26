"use client";

import * as React from "react";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { useBookingFinance } from "../booking-finance/useBookingFinance";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { isCancelledOrNoShowBookingStatus } from "./bookingStatus";
import { buildSalesPayableSummary } from "./buildSalesPayableSummary";
import SalesPayableBar from "./SalesPayableBar";

type SalesDrawerPayableFooterProps = {
  viewingBookingEvent: CalendarEvent | null;
};

/** Drawer footer for Sales tab — live ledger payable breakdown. */
export default function SalesDrawerPayableFooter({
  viewingBookingEvent,
}: SalesDrawerPayableFooterProps) {
  const hidePayable = isCancelledOrNoShowBookingStatus(
    viewingBookingEvent?.status,
  );
  const parsed = viewingBookingEvent
    ? parseApiCalendarEventId(viewingBookingEvent.id)
    : null;
  const financeBookingId =
    viewingBookingEvent?.bookingCode ||
    (parsed?.kind === "booking" ? parsed.id : null) ||
    "";

  const { finance } = useBookingFinance(financeBookingId, {
    skip: hidePayable || !financeBookingId,
  });

  const summary = React.useMemo(
    () => (hidePayable ? null : buildSalesPayableSummary(finance)),
    [finance, hidePayable],
  );

  if (!summary) return null;
  return <SalesPayableBar summary={summary} />;
}
