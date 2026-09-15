import * as React from "react";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { useMessagingWidget } from "../../messaging/MessagingWidgetContext";
import { prepareBookingMessagingOpen } from "../../messaging/openBookingMessaging";
import { useOpenMessagingForBookingMutation } from "../../../../store/services/messagingApi";
import { resolveCalendarMessagingRef } from "../bookingEventDetails";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";

type ShowSnackbar = (input: {
  severity: "error" | "success" | "warning" | "info";
  message: string;
}) => void;

/** Booking chat open (ponytail: deps-bag slice of mega hook). */
export function useProfessionalFixedLocationCalendarMessaging(showSnackbar: ShowSnackbar) {
  const { openMessaging } = useMessagingWidget();
  const [openMessagingForBooking] = useOpenMessagingForBookingMutation();

  const openBookingMessages = React.useCallback(
    (ev: CalendarEvent) => {
      const { bookingRef, customerId } = resolveCalendarMessagingRef(ev);
      void (async () => {
        try {
          const result = await openMessagingForBooking({
            bookingRef,
            customerId,
          }).unwrap();
          openMessaging(prepareBookingMessagingOpen(result));
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              "Unable to open chat for this booking.",
            ),
          });
        }
      })();
    },
    [openMessaging, openMessagingForBooking, showSnackbar],
  );

  return { openMessaging, openMessagingForBooking, openBookingMessages };
}
