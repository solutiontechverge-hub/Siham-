"use client";

import * as React from "react";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import { buildBookingActivityTimeline } from "../calendar/buildBookingActivityTimeline";
import { findActivityComparisonItem } from "../calendar/buildActivityComparison";
import type { BookingActivityApiEvent, BookingActivityItem } from "../calendar/bookingActivity.types";
import type { CalendarBookingDetails } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { detectSilentUpdatedFields } from "../calendar/bookingRequestNegotiation";
import { resolvePrimaryProfessional } from "./clientBookingDetails.helpers";
import type { ClientBookingDraft } from "./types";

type ActivityApiBooking = {
  id: string;
  unique_code?: string | null;
  status: string;
  [key: string]: unknown;
};

/** Pure mapper: scope API bookings + build timeline for the open client booking. */
export function buildClientBookingActivityTimelineItems(input: {
  apiBookings: readonly ActivityApiBooking[] | null | undefined;
  apiBookingId: string | null;
  bookingRef: string;
  bookingStatus: ClientBookingStatus;
  userEmail?: string | null;
  requesterName: string;
  hasIncomingEditRequest: boolean;
  editRequestIsPending: boolean;
  draft: ClientBookingDraft | null;
  bookingNotesMeta?: CalendarBookingDetails | null;
  displayDraft: ClientBookingDraft | null;
  apiEvents: BookingActivityApiEvent[] | null | undefined;
}): BookingActivityItem[] {
  const scopedBookings = (input.apiBookings ?? []).filter((booking) => {
    if (input.apiBookingId && String(booking.id) === String(input.apiBookingId))
      return true;
    if (input.bookingRef && booking.unique_code === input.bookingRef) return true;
    return false;
  });

  return buildBookingActivityTimeline({
    bookings: scopedBookings,
    clientEmail: input.userEmail ?? null,
    clientName: input.requesterName,
    currentBookingId: input.apiBookingId,
    currentBookingCode: input.bookingRef,
    currentScenario: input.hasIncomingEditRequest
      ? "EBR"
      : input.editRequestIsPending
        ? "ER"
        : input.bookingStatus === "requested"
          ? "BR"
          : null,
    currentStatus: input.bookingStatus,
    currentProfessionalName: resolvePrimaryProfessional(input.draft).name,
    currentBookingType: null,
    currentDetails: {
      originalServices: input.bookingNotesMeta?.originalServices,
      originalGuests: input.bookingNotesMeta?.originalGuests,
      services: input.displayDraft?.services,
      products: input.displayDraft?.products,
      editedServiceIds: input.bookingNotesMeta?.editedServiceIds,
      editedProductIds: input.bookingNotesMeta?.editedProductIds,
      addedServiceIds: input.bookingNotesMeta?.addedServiceIds,
      cancelledServiceIds: input.bookingNotesMeta?.cancelledServiceIds,
      phoneCode: input.bookingNotesMeta?.phoneCode,
      phoneNumber: input.bookingNotesMeta?.phoneNumber,
      guests: input.bookingNotesMeta?.guests,
      clientSnapshot: input.bookingNotesMeta?.clientSnapshot,
      desiredLocation: input.bookingNotesMeta?.desiredLocation,
      silentUpdated: input.bookingNotesMeta?.silentUpdated,
      silentUpdateSnapshot: input.bookingNotesMeta?.silentUpdateSnapshot,
      lastEditedBy: input.bookingNotesMeta?.lastEditedBy,
      scheduleEdited: input.bookingNotesMeta?.scheduleEdited,
    },
    apiEvents: input.apiEvents ?? null,
    mode: "activity",
  });
}

export function buildSilentFieldUpdates(input: {
  showStatusUpdated: boolean;
  bookingNotesMeta?: CalendarBookingDetails | null;
  displayPeople?: ClientBookingDraft["people"] | null;
}) {
  if (!input.showStatusUpdated) {
    return {
      phoneUpdated: false,
      guestIds: [] as string[],
      serviceIds: [] as string[],
    };
  }
  return detectSilentUpdatedFields({
    snapshot: input.bookingNotesMeta?.silentUpdateSnapshot,
    currentPhoneCode: input.bookingNotesMeta?.phoneCode,
    currentPhoneNumber: input.bookingNotesMeta?.phoneNumber,
    // Compare against raw persisted notes/clientSnapshot so reorder + guest-name
    // chips do not get lost by draft normalization/merging.
    currentGuests: input.bookingNotesMeta?.guests,
    currentPeople:
      input.bookingNotesMeta?.clientSnapshot?.people ?? input.displayPeople,
    currentServices: input.bookingNotesMeta?.services,
  });
}

export function useClientBookingActivityTimeline(input: {
  apiBookings: readonly ActivityApiBooking[] | null | undefined;
  apiBookingId: string | null;
  bookingRef: string;
  bookingStatus: ClientBookingStatus;
  userEmail?: string | null;
  requesterName: string;
  hasIncomingEditRequest: boolean;
  editRequestIsPending: boolean;
  draft: ClientBookingDraft | null;
  bookingNotesMeta?: CalendarBookingDetails | null;
  displayDraft: ClientBookingDraft | null;
  apiEvents: BookingActivityApiEvent[] | null | undefined;
  showStatusUpdated: boolean;
}) {
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [activityDetailItem, setActivityDetailItem] =
    React.useState<BookingActivityItem | null>(null);

  const activityTimelineItems = React.useMemo(
    () =>
      buildClientBookingActivityTimelineItems({
        apiBookings: input.apiBookings,
        apiBookingId: input.apiBookingId,
        bookingRef: input.bookingRef,
        bookingStatus: input.bookingStatus,
        userEmail: input.userEmail,
        requesterName: input.requesterName,
        hasIncomingEditRequest: input.hasIncomingEditRequest,
        editRequestIsPending: input.editRequestIsPending,
        draft: input.draft,
        bookingNotesMeta: input.bookingNotesMeta,
        displayDraft: input.displayDraft,
        apiEvents: input.apiEvents,
      }),
    [
      input.apiBookings,
      input.apiBookingId,
      input.apiEvents,
      input.bookingNotesMeta,
      input.bookingRef,
      input.bookingStatus,
      input.displayDraft,
      input.draft,
      input.editRequestIsPending,
      input.hasIncomingEditRequest,
      input.requesterName,
      input.userEmail,
    ],
  );

  const silentFieldUpdates = React.useMemo(
    () =>
      buildSilentFieldUpdates({
        showStatusUpdated: input.showStatusUpdated,
        bookingNotesMeta: input.bookingNotesMeta,
        displayPeople: input.displayDraft?.people,
      }),
    [
      input.bookingNotesMeta,
      input.displayDraft?.people,
      input.showStatusUpdated,
    ],
  );

  const openActivityComparison = React.useCallback(
    (mode?: "ebr" | "er" | "silent_updated") => {
      const target =
        findActivityComparisonItem(activityTimelineItems, {
          bookingRef: input.bookingRef,
          mode,
        }) ??
        activityTimelineItems.find(
          (item) => (item.comparison?.rows.length ?? 0) > 0,
        ) ??
        null;
      setActivityOpen(true);
      setActivityDetailItem(target);
    },
    [activityTimelineItems, input.bookingRef],
  );

  return {
    activityOpen,
    setActivityOpen,
    activityDetailItem,
    setActivityDetailItem,
    activityTimelineItems,
    silentFieldUpdates,
    openActivityComparison,
  };
}
