"use client";

import * as React from "react";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";
import { mapApiBookingToClientRecord } from "../../../app/clients/booking/clientBookingApi.mapper";
import { ACTIVE_BOOKING_ID_KEY, CHECKOUT_REF_KEY } from "../../../app/clients/booking/clientBookingSession";
import { useGetMyBookingsQuery } from "../../../store/services/businessApi";

function matchActiveBooking(
  bookings: ClientBookingRecord[],
  activeId: string | null,
  bookingRef: string | null,
): ClientBookingRecord | null {
  if (!bookings.length) return null;
  if (activeId) {
    const byId = bookings.find((b) => b.id === activeId || b.apiBookingId === activeId);
    if (byId) return byId;
  }
  if (bookingRef) {
    const normalized = bookingRef.replace(/^#/, "").trim();
    const byRef = bookings.find(
      (b) => b.bookingRef === normalized || b.bookingRef === bookingRef || b.id === normalized,
    );
    if (byRef) return byRef;
  }
  return null;
}

export function useActiveClientBooking() {
  const { data, isLoading, isFetching, refetch } = useGetMyBookingsQuery();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [bookingRef, setBookingRef] = React.useState<string | null>(null);

  const syncSessionKeys = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setActiveId(window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY));
    setBookingRef(window.sessionStorage.getItem(CHECKOUT_REF_KEY));
  }, []);

  React.useEffect(() => {
    syncSessionKeys();
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === ACTIVE_BOOKING_ID_KEY ||
        event.key === CHECKOUT_REF_KEY ||
        event.key === null
      ) {
        syncSessionKeys();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncSessionKeys);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncSessionKeys);
    };
  }, [syncSessionKeys]);

  const bookings = React.useMemo(() => {
    const rows = data?.data ?? [];
    return rows.map(mapApiBookingToClientRecord);
  }, [data]);

  const record = React.useMemo(
    () => matchActiveBooking(bookings, activeId, bookingRef),
    [activeId, bookingRef, bookings],
  );

  React.useEffect(() => {
    if (!record || typeof window === "undefined") return;
    window.sessionStorage.setItem(ACTIVE_BOOKING_ID_KEY, record.id);
    if (record.bookingRef) {
      window.sessionStorage.setItem(CHECKOUT_REF_KEY, record.bookingRef);
    }
  }, [record]);

  return {
    record,
    refresh: refetch,
    isLoading: isLoading || isFetching,
  };
}
