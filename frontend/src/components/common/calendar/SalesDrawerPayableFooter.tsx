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

  const bookingStatus = String(
    viewingBookingEvent?.status ?? finance?.bookingStatus ?? "",
  ).toLowerCase();
  // Cancel / no-show Sales: Fee Summary card owns the fee UI — hide PAYABLE SUMMARY.
  const hidePayableFooter =
    bookingStatus === "cancelled" ||
    bookingStatus === "canceled" ||
    bookingStatus === "no_show" ||
    bookingStatus === "no show";

  const summary = React.useMemo(
    () =>
      hidePayableFooter
        ? null
        : buildSalesPayableSummary(finance, {
            bookingStatus:
              viewingBookingEvent?.status ?? finance?.bookingStatus ?? null,
          }),
    [finance, hidePayableFooter, viewingBookingEvent?.status],
  );

  if (!summary) return null;
  return <SalesPayableBar summary={summary} />;
}
