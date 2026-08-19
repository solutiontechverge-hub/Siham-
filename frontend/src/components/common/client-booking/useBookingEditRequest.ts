"use client";

import * as React from "react";
import {
  BOOKING_EDIT_REQUEST_UPDATED_EVENT,
  getBookingEditRequest,
  type BookingEditRequestRecord,
} from "./bookingEditRequest";

export function useBookingEditRequest(bookingRef: string) {
  const [record, setRecord] = React.useState<BookingEditRequestRecord>(() =>
    bookingRef ? getBookingEditRequest(bookingRef) : { status: "none" },
  );

  const refresh = React.useCallback(() => {
    if (!bookingRef) return;
    setRecord(getBookingEditRequest(bookingRef));
  }, [bookingRef]);

  React.useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(BOOKING_EDIT_REQUEST_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      window.removeEventListener(BOOKING_EDIT_REQUEST_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, [refresh]);

  return {
    ...record,
    isApproved: record.status === "approved",
    isPending: record.status === "pending",
    isSuggested: record.status === "suggested",
    isRejected: record.status === "rejected",
    isAccepted: record.status === "accepted",
    isEditGrantActive:
      record.status === "approved" &&
      Boolean(record.editGrantActive) &&
      record.initiatedBy !== "professional",
    refresh,
  };
}
