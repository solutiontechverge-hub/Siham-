import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { shouldAutoOpenBookingCheckout } from "../bookingCheckout";
import { resolveTimeBasedCalendarStatus } from "../bookingStatus";

type Args = {
  slotDrawerOpen: boolean;
  viewingBookingEvent: CalendarEvent | null | undefined;
  bookingCheckoutOpen: boolean;
  /** Minute tick so end-time → Completed is observed without a refetch. */
  nowMin: number;
  setBookingCheckoutOpen: (open: boolean) => void;
  setSlotDrawerTab: (tab: "booking" | "sales" | "activity") => void;
};

/**
 * Auto-open checkout when display status enters Completed with unpaid balance
 * (time-based end or opening an already-completed unpaid booking).
 */
export function useAutoOpenBookingCheckout({
  slotDrawerOpen,
  viewingBookingEvent,
  bookingCheckoutOpen,
  nowMin,
  setBookingCheckoutOpen,
  setSlotDrawerTab,
}: Args) {
  const prevStatusRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!slotDrawerOpen) {
      prevStatusRef.current = null;
      return;
    }
    const event = viewingBookingEvent;
    if (!event) return;

    const status = resolveTimeBasedCalendarStatus(event);
    const prev = prevStatusRef.current;

    if (bookingCheckoutOpen) {
      prevStatusRef.current = status;
      return;
    }

    const enteredCompleted =
      status === "Completed" && (prev === null || prev !== "Completed");
    prevStatusRef.current = status;
    if (!enteredCompleted) return;
    if (!shouldAutoOpenBookingCheckout(event)) return;

    setSlotDrawerTab("booking");
    setBookingCheckoutOpen(true);
  }, [
    bookingCheckoutOpen,
    nowMin,
    setBookingCheckoutOpen,
    setSlotDrawerTab,
    slotDrawerOpen,
    viewingBookingEvent,
  ]);
}
