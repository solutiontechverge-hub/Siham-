"use client";

import * as React from "react";
import {
  BOOKINGS_CHANGED_EVENT,
  findClientBookingById,
  type ClientBookingRecord,
} from "../../../app/clients/booking/clientBookingRecords";
import { ACTIVE_BOOKING_ID_KEY } from "../../../app/clients/booking/clientBookingSession";

export function useActiveClientBooking() {
  const [record, setRecord] = React.useState<ClientBookingRecord | null>(null);

  const refresh = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const id = window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY);
    if (!id) {
      setRecord(null);
      return;
    }
    setRecord(findClientBookingById(id) ?? null);
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener(BOOKINGS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_CHANGED_EVENT, refresh);
  }, [refresh]);

  return record;
}
