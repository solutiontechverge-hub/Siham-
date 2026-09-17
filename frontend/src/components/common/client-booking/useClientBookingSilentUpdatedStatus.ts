"use client";

import * as React from "react";
import {
  cancelScheduledMarkBookingUpdateSeen,
  hasRememberedSilentUpdateVisit,
  hasUnseenBookingUpdate,
  rememberSilentUpdateVisit,
  scheduleMarkBookingUpdateSeen,
} from "../calendar/bookingUpdateSeen";
import { parseCalendarEntryNotes } from "../calendar/bookingEventDetails";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";

type SilentUpdatedBookingSlice = {
  notes?: string | null;
  silentUpdated?: boolean | null;
  updatedAt?: string | null;
  lastEditedBy?: "client" | "professional" | null;
} | null | undefined;

/**
 * First open: show Updated next to Confirmed (not Confirmed Edited).
 * Keep chips for this visit; mark seen only after leaving (survives Strict Mode remount).
 */
export function useClientBookingSilentUpdatedStatus(input: {
  bookingRef: string;
  bookingStatus: ClientBookingStatus;
  isEbrIncoming: boolean;
  editRequestIsPending: boolean;
  activeBooking: SilentUpdatedBookingSlice;
}) {
  const {
    bookingRef,
    bookingStatus,
    isEbrIncoming,
    editRequestIsPending,
    activeBooking,
  } = input;

  const [showStatusUpdated, setShowStatusUpdated] = React.useState(false);

  React.useEffect(() => {
    setShowStatusUpdated(false);
  }, [bookingRef]);

  React.useEffect(() => {
    if (!bookingRef) return;
    cancelScheduledMarkBookingUpdateSeen("client", bookingRef);
    const notesMeta = parseCalendarEntryNotes(activeBooking?.notes);
    const silentUpdated =
      Boolean(activeBooking?.silentUpdated) ||
      Boolean(notesMeta?.silentUpdated);
    if (
      isEbrIncoming ||
      editRequestIsPending ||
      bookingStatus !== "confirmed" ||
      !silentUpdated
    ) {
      return;
    }
    const lastEditedBy =
      activeBooking?.lastEditedBy ??
      notesMeta?.lastEditedBy ??
      // Client details: missing editor + silent flag → treat as pro so tags aren't dropped.
      ("professional" as const);
    const unseen = hasUnseenBookingUpdate({
      viewer: "client",
      bookingRef,
      updatedAt: activeBooking?.updatedAt,
      lastEditedBy,
    });
    const sameVisit = hasRememberedSilentUpdateVisit(
      "client",
      bookingRef,
      activeBooking?.updatedAt,
    );
    if (!unseen && !sameVisit) return;
    setShowStatusUpdated(true);
    rememberSilentUpdateVisit("client", bookingRef, activeBooking?.updatedAt);
  }, [
    bookingRef,
    bookingStatus,
    isEbrIncoming,
    editRequestIsPending,
    activeBooking?.silentUpdated,
    activeBooking?.updatedAt,
    activeBooking?.lastEditedBy,
    activeBooking?.notes,
  ]);

  const showedSilentUpdatedRef = React.useRef(false);
  React.useEffect(() => {
    showedSilentUpdatedRef.current = showStatusUpdated;
  }, [showStatusUpdated]);

  // Mark seen after leaving details — only if this visit showed Updated chips.
  React.useEffect(() => {
    if (!bookingRef) return;
    const updatedAt = activeBooking?.updatedAt?.trim();
    const ref = bookingRef;
    cancelScheduledMarkBookingUpdateSeen("client", ref);
    return () => {
      if (!showedSilentUpdatedRef.current || !updatedAt) return;
      scheduleMarkBookingUpdateSeen("client", ref, updatedAt);
    };
  }, [bookingRef, activeBooking?.updatedAt]);

  return showStatusUpdated;
}
