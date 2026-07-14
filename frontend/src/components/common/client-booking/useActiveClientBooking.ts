"use client";

import * as React from "react";
import { mapApiBookingToClientRecord } from "../../../app/clients/booking/clientBookingApi.mapper";
import {
  ACTIVE_BOOKING_ID_KEY,
  CHECKOUT_REF_KEY,
  getActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import {
  enrichClientBookingRecord,
  mergeClientBookingDraftRichness,
} from "../../../app/clients/booking/clientBookingDraftCache";
import { useGetMyBookingsQuery } from "../../../store/services/businessApi";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";

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

function sameBooking(a: ClientBookingRecord, b: ClientBookingRecord) {
  if (a.apiBookingId && b.apiBookingId && a.apiBookingId === b.apiBookingId) return true;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.bookingRef && b.bookingRef && a.bookingRef === b.bookingRef) return true;
  return false;
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
    return rows.map((row) => enrichClientBookingRecord(mapApiBookingToClientRecord(row)));
  }, [data]);

  const record = React.useMemo(() => {
    const fromApi = matchActiveBooking(bookings, activeId, bookingRef);
    const sessionRecord = getActiveBookingSession();

    if (fromApi && sessionRecord && sameBooking(fromApi, sessionRecord) && sessionRecord.draft && fromApi.draft) {
      return enrichClientBookingRecord({
        ...fromApi,
        draft: mergeClientBookingDraftRichness(fromApi.draft, sessionRecord.draft),
        incomingEditRequest: fromApi.incomingEditRequest ?? sessionRecord.incomingEditRequest,
      });
    }

    if (fromApi) return enrichClientBookingRecord(fromApi);

    if (!sessionRecord) return null;

    const sessionId = sessionRecord.apiBookingId ?? sessionRecord.id;
    if (activeId && sessionId !== activeId) return null;

    if (bookingRef) {
      const normalized = bookingRef.replace(/^#/, "").trim();
      const recordRef = sessionRecord.bookingRef?.replace(/^#/, "").trim();
      if (recordRef && recordRef !== normalized && sessionId !== normalized) return null;
    }

    return enrichClientBookingRecord(sessionRecord);
  }, [activeId, bookingRef, bookings]);

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
