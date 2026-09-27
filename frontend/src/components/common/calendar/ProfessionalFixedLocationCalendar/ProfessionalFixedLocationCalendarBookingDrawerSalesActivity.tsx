"use client";

import { mollureBodyMutedSx } from "../../../../theme/mollureHierarchy";

import { Box } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import { parseApiCalendarEventId } from "../bookingEventDetails";

import BookingActivityOverview from "../BookingActivityOverview";

import SalesOverview from "../SalesOverview";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSalesActivityBag = Pick<
  Vm,
  | "activityDetailItem"
  | "activityTimelineItems"
  | "bookingPhoneDraft"
  | "clientActivityIdentity"
  | "clientBookingsForActivity"
  | "data"
  | "drawerSalesActivityContext"
  | "m"
  | "setActivityDetailItem"
  | "setEvents"
  | "setSlotStatus"
  | "slotDrawerTab"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerSalesActivityProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerSalesActivityBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerSalesActivity({ bag }: ProfessionalFixedLocationCalendarBookingDrawerSalesActivityProps) {
  const {
    activityDetailItem,
    activityTimelineItems,
    bookingPhoneDraft,
    clientActivityIdentity,
    clientBookingsForActivity,
    data,
    drawerSalesActivityContext,
    m,
    setActivityDetailItem,
    setEvents,
    setSlotStatus,
    slotDrawerTab,
  } = bag;

  return (
    <Box sx={{ pt: 1 }}>
      {drawerSalesActivityContext ? (
        slotDrawerTab === "sales" ? (
          <SalesOverview
            bookings={clientBookingsForActivity}
            currentEvent={drawerSalesActivityContext}
            clientName={clientActivityIdentity.name}
            clientEmail={clientActivityIdentity.email}
            clientPhone={
              [
                bookingPhoneDraft.phoneCode,
                bookingPhoneDraft.phoneNumber,
              ]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              drawerSalesActivityContext.details?.phoneNumber ||
              ""
            }
            fallbackResourceId={
              drawerSalesActivityContext.resourceId ||
              data.resources[0]?.id ||
              "unassigned"
            }
            onBookingCompleted={(bookingId) => {
              // Invoice issued → In Progress + payment pending (Completed after pay).
              setEvents((prev) =>
                prev.map((event) => {
                  const parsed = parseApiCalendarEventId(event.id);
                  if (parsed?.kind !== "booking" || parsed.id !== bookingId) {
                    return event;
                  }
                  return {
                    ...event,
                    status: "In Progress",
                    details: {
                      ...(event.details ?? {}),
                      waitingForPayment: true,
                    },
                  };
                }),
              );
              setSlotStatus("In Progress");
            }}
          />
        ) : (
          <BookingActivityOverview
            title="Activity Overview"
            items={activityTimelineItems}
            emptyMessage="No activity for this booking yet."
            selectedDetail={activityDetailItem}
            onSelectedDetailChange={setActivityDetailItem}
          />
        )
      ) : (
        <BodyText
          sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.6) })}
        >
          Add booking details to view{" "}
          {slotDrawerTab === "sales" ? "sales" : "activity"}.
        </BodyText>
      )}
    </Box>
  );
}
