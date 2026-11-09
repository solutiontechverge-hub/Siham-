import * as React from "react";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  useGetBookingActivityQuery,
  useGetMyBookingsQuery,
} from "../../../../store/services/businessApi";
import { buildBookingActivityTimeline } from "../buildBookingActivityTimeline";
import { findActivityComparisonItem } from "../buildActivityComparison";
import type { BookingActivityItem } from "../bookingActivity.types";
import { parseApiCalendarEventId } from "../bookingEventDetails";
import {
  matchClientBookingsForActivity,
  resolveClientActivityIdentity,
} from "./useProfessionalFixedLocationCalendar.helpers";

export type UseProfessionalFixedLocationCalendarSalesActivityArgs = {
  slotDrawerOpen: boolean;
  slotDrawerTab: "booking" | "sales" | "activity";
  drawerSalesActivityContext: CalendarEvent | null;
  selectedClient?: { email?: string; name?: string } | null;
  guestDraft: { firstName: string; lastName: string };
  nonMollureDraft: { firstName: string; lastName: string };
  resources: readonly { id: string; name: string }[];
  setSlotDrawerTab: React.Dispatch<
    React.SetStateAction<"booking" | "sales" | "activity">
  >;
  setActivityDetailItem: React.Dispatch<
    React.SetStateAction<BookingActivityItem | null>
  >;
};

export function useProfessionalFixedLocationCalendarSalesActivity({
  slotDrawerOpen,
  slotDrawerTab,
  drawerSalesActivityContext,
  selectedClient,
  guestDraft,
  nonMollureDraft,
  resources,
  setSlotDrawerTab,
  setActivityDetailItem,
}: UseProfessionalFixedLocationCalendarSalesActivityArgs) {
  const { data: myBookingsResponse } = useGetMyBookingsQuery(undefined, {
    skip:
      !slotDrawerOpen ||
      (slotDrawerTab !== "activity" && slotDrawerTab !== "sales"),
  });

  const clientActivityIdentity = React.useMemo(
    () =>
      resolveClientActivityIdentity({
        selectedClientEmail: selectedClient?.email,
        selectedClientName: selectedClient?.name,
        contextEmail: drawerSalesActivityContext?.details?.clientEmail,
        contextName: drawerSalesActivityContext?.showClientName,
        guestFirstName: guestDraft.firstName,
        guestLastName: guestDraft.lastName,
        nonMollureFirstName: nonMollureDraft.firstName,
        nonMollureLastName: nonMollureDraft.lastName,
      }),
    [
      selectedClient?.email,
      selectedClient?.name,
      drawerSalesActivityContext?.details?.clientEmail,
      drawerSalesActivityContext?.showClientName,
      guestDraft.firstName,
      guestDraft.lastName,
      nonMollureDraft.firstName,
      nonMollureDraft.lastName,
    ],
  );

  const clientBookingsForActivity = React.useMemo(
    () =>
      matchClientBookingsForActivity(
        myBookingsResponse?.data ?? [],
        drawerSalesActivityContext,
      ),
    [drawerSalesActivityContext, myBookingsResponse?.data],
  );

  // Offline calendar entries are `ce-<uuid>` — that uuid is not a bookings.id.
  // Activity rows are keyed by unique_code; only pass a real booking uuid as bookingId.
  const parsedActivityEventId = drawerSalesActivityContext
    ? parseApiCalendarEventId(drawerSalesActivityContext.id)
    : null;
  const activityBookingId =
    parsedActivityEventId?.kind === "booking" ? parsedActivityEventId.id : null;
  const activityBookingCode = drawerSalesActivityContext?.bookingCode ?? null;

  const { data: bookingActivityResponse } = useGetBookingActivityQuery(
    {
      bookingId: activityBookingId,
      bookingCode: activityBookingCode,
    },
    {
      skip: !activityBookingId && !activityBookingCode,
      refetchOnMountOrArgChange: true,
      pollingInterval: slotDrawerOpen && slotDrawerTab === "activity" ? 12_000 : 0,
    },
  );

  const activityTimelineItems = React.useMemo(
    () =>
      buildBookingActivityTimeline({
        bookings: clientBookingsForActivity,
        clientEmail: clientActivityIdentity.email,
        clientName: clientActivityIdentity.name,
        currentBookingId: activityBookingId,
        currentBookingCode: activityBookingCode,
        currentScenario: drawerSalesActivityContext?.bookingScenario ?? null,
        currentStatus: drawerSalesActivityContext?.status ?? null,
        currentCancellationReason:
          drawerSalesActivityContext?.details?.cancellationReason ?? null,
        currentProfessionalName:
          resources.find(
            (r) => r.id === drawerSalesActivityContext?.resourceId,
          )?.name ?? null,
        currentBookingType: drawerSalesActivityContext?.bookingType ?? null,
        currentDetails: drawerSalesActivityContext?.details ?? null,
        currentDateISO: drawerSalesActivityContext?.date ?? null,
        currentStart: drawerSalesActivityContext?.start ?? null,
        // Always server-driven when viewing a booking — never synthesize from browser state.
        apiEvents:
          activityBookingId || activityBookingCode
            ? (bookingActivityResponse?.data ?? [])
            : null,
        mode: "activity",
      }),
    [
      activityBookingCode,
      activityBookingId,
      bookingActivityResponse?.data,
      clientActivityIdentity.email,
      clientActivityIdentity.name,
      clientBookingsForActivity,
      resources,
      drawerSalesActivityContext,
    ],
  );

  const openActivityComparison = React.useCallback(
    (mode?: "ebr" | "er" | "silent_updated") => {
      const bookingRef =
        drawerSalesActivityContext?.bookingCode ||
        (drawerSalesActivityContext
          ? parseApiCalendarEventId(drawerSalesActivityContext.id)?.id
          : null) ||
        null;
      const target =
        findActivityComparisonItem(activityTimelineItems, {
          bookingRef,
          mode,
        }) ??
        activityTimelineItems.find(
          (item) => (item.comparison?.rows.length ?? 0) > 0,
        ) ??
        null;
      setSlotDrawerTab("activity");
      setActivityDetailItem(target);
    },
    [
      activityTimelineItems,
      drawerSalesActivityContext,
      setActivityDetailItem,
      setSlotDrawerTab,
    ],
  );

  return {
    activityBookingCode,
    activityBookingId,
    activityTimelineItems,
    bookingActivityResponse,
    clientActivityIdentity,
    clientBookingsForActivity,
    myBookingsResponse,
    openActivityComparison,
  };
}
