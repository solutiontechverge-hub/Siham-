"use client";

import * as React from "react";
import { mapApiBookingToClientRecord } from "../../../app/clients/booking/clientBookingApi.mapper";
import {
  ACTIVE_BOOKING_CHANGED_EVENT,
  ACTIVE_BOOKING_ID_KEY,
  CHECKOUT_REF_KEY,
  getActiveBookingSession,
  isEbrDraftLocked,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import {
  enrichClientBookingRecord,
  mergeClientBookingDraftRichness,
} from "../../../app/clients/booking/clientBookingDraftCache";
import { useGetMyBookingsQuery } from "../../../store/services/businessApi";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";
import { parseCalendarEntryNotes } from "../calendar/bookingEventDetails";

function normalizeBookingLookup(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/^#/, "")
    .replace(/^BK-/i, "")
    .trim()
    .toUpperCase();
}

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
    const normalized = normalizeBookingLookup(bookingRef);
    const byRef = bookings.find((b) => {
      const refs = [b.bookingRef, b.id, b.apiBookingId].map(normalizeBookingLookup);
      return refs.includes(normalized);
    });
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

function bookingContentKey(record: ClientBookingRecord | null | undefined) {
  if (!record) return "";
  return [
    record.notes ?? "",
    record.status,
    record.prepaid ? "1" : "0",
    record.draft?.total ?? "",
    record.draft?.services?.length ?? 0,
    record.draft?.products?.length ?? 0,
    (record.draft?.services ?? []).map((s) => `${s.id}:${s.price}`).join("|"),
    (record.draft?.products ?? []).map((p) => `${p.id}:${p.price}x${p.quantity}`).join("|"),
  ].join("::");
}

/** Column can lag after Pay Now; notes `prepaymentStatus: confirmed` is set in the same write. */
function notesMarkPrepaymentPaid(notes: string | null | undefined) {
  return parseCalendarEntryNotes(notes)?.prepaymentStatus === "confirmed";
}

function countSplitPaid(notes: string | null | undefined) {
  const split = parseCalendarEntryNotes(notes)?.splitBill as
    | { payers?: Array<{ paid?: boolean }> }
    | undefined;
  return (split?.payers ?? []).filter((p) => p.paid).length;
}

function resolveActivePrepaid(
  fromApi: ClientBookingRecord,
  sessionRecord: ClientBookingRecord | null,
): { prepaid: boolean; notes: string | null | undefined } {
  const apiPaid =
    Boolean(fromApi.prepaid) || notesMarkPrepaymentPaid(fromApi.notes);
  const sessionPaid =
    sessionRecord != null &&
    sameBooking(fromApi, sessionRecord) &&
    notesMarkPrepaymentPaid(sessionRecord.notes);
  // After-treatment Pay Now stamps notes first; keep session notes until API catches up.
  const sessionNotesFresher =
    sessionRecord != null &&
    sameBooking(fromApi, sessionRecord) &&
    countSplitPaid(sessionRecord.notes) > countSplitPaid(fromApi.notes);
  return {
    prepaid: apiPaid || sessionPaid,
    notes: sessionNotesFresher
      ? (sessionRecord.notes ?? fromApi.notes)
      : sessionPaid && !apiPaid
        ? (sessionRecord.notes ?? fromApi.notes)
        : fromApi.notes,
  };
}

export function useActiveClientBooking() {
  const { data, isLoading, isFetching, refetch, isUninitialized } =
    useGetMyBookingsQuery(undefined, {
    // Keep details page fresh while open (pro edits arrive via tag invalidation + socket).
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [bookingRef, setBookingRef] = React.useState<string | null>(null);
  const [sessionTick, setSessionTick] = React.useState(0);

  const syncSessionKeys = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const urlRef = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (urlRef) {
      window.sessionStorage.setItem(
        CHECKOUT_REF_KEY,
        urlRef.replace(/^#/, "").trim(),
      );
    }
    setActiveId(window.sessionStorage.getItem(ACTIVE_BOOKING_ID_KEY));
    setBookingRef(window.sessionStorage.getItem(CHECKOUT_REF_KEY));
  }, []);

  React.useEffect(() => {
    syncSessionKeys();
    const onSessionChanged = () => {
      syncSessionKeys();
      setSessionTick((n) => n + 1);
    };
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === ACTIVE_BOOKING_ID_KEY ||
        event.key === CHECKOUT_REF_KEY ||
        event.key === null
      ) {
        onSessionChanged();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncSessionKeys);
    window.addEventListener(ACTIVE_BOOKING_CHANGED_EVENT, onSessionChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncSessionKeys);
      window.removeEventListener(ACTIVE_BOOKING_CHANGED_EVENT, onSessionChanged);
    };
  }, [syncSessionKeys]);

  const bookings = React.useMemo(() => {
    const rows = data?.data ?? [];
    return rows.map((row) => enrichClientBookingRecord(mapApiBookingToClientRecord(row)));
  }, [data]);

  const record = React.useMemo(() => {
    void sessionTick;
    const fromApi = matchActiveBooking(bookings, activeId, bookingRef);
    const sessionRecord = getActiveBookingSession();
    const draftLocked = isEbrDraftLocked();

    // Editor just returned with new time/services — do not let stale API win.
    if (draftLocked && sessionRecord?.draft) {
      if (fromApi && sameBooking(fromApi, sessionRecord)) {
        const paid = resolveActivePrepaid(fromApi, sessionRecord);
        return enrichClientBookingRecord({
          ...fromApi,
          draft: sessionRecord.draft,
          prepaid: paid.prepaid,
          notes: paid.notes ?? sessionRecord.notes ?? fromApi.notes,
        });
      }
      return enrichClientBookingRecord(sessionRecord);
    }

    if (fromApi && sessionRecord && sameBooking(fromApi, sessionRecord) && sessionRecord.draft && fromApi.draft) {
      // API is source of truth for pro BR updates; session only fills missing guest/project richness.
      const draft = mergeClientBookingDraftRichness(fromApi.draft, sessionRecord.draft);
      const paid = resolveActivePrepaid(fromApi, sessionRecord);
      return enrichClientBookingRecord({
        ...fromApi,
        draft,
        prepaid: paid.prepaid,
        notes: paid.notes,
        incomingEditRequest: fromApi.incomingEditRequest ?? sessionRecord.incomingEditRequest,
      });
    }

    if (fromApi) {
      const paid = resolveActivePrepaid(fromApi, sessionRecord);
      return enrichClientBookingRecord({
        ...fromApi,
        prepaid: paid.prepaid,
        notes: paid.notes,
      });
    }

    if (!sessionRecord) return null;

    const sessionId = sessionRecord.apiBookingId ?? sessionRecord.id;
    if (activeId && sessionId !== activeId) return null;

    if (bookingRef) {
      const normalized = bookingRef.replace(/^#/, "").trim();
      const recordRef = sessionRecord.bookingRef?.replace(/^#/, "").trim();
      if (recordRef && recordRef !== normalized && sessionId !== normalized) return null;
    }

    return enrichClientBookingRecord(sessionRecord);
  }, [activeId, bookingRef, bookings, sessionTick]);

  // Keep sessionStorage in sync with latest API so staying on the page shows pro edits.
  React.useEffect(() => {
    if (!record || typeof window === "undefined") return;
    window.sessionStorage.setItem(ACTIVE_BOOKING_ID_KEY, record.apiBookingId ?? record.id);
    if (record.bookingRef) {
      window.sessionStorage.setItem(CHECKOUT_REF_KEY, record.bookingRef);
    }

    const sessionRecord = getActiveBookingSession();
    if (isEbrDraftLocked()) return;
    if (!sessionRecord || !sameBooking(record, sessionRecord)) {
      setActiveBookingSession(record);
      return;
    }
    if (bookingContentKey(record) !== bookingContentKey(sessionRecord)) {
      setActiveBookingSession(record);
    }
  }, [record]);

  return {
    record,
    apiBookings: data?.data ?? [],
    refresh: () => {
      if (isUninitialized) return;
      return refetch();
    },
    isLoading: isLoading || isFetching,
  };
}
