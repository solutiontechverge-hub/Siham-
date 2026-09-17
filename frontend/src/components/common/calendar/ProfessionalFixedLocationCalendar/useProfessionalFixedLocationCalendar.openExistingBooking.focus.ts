import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  FOCUS_BOOKING_DATE_KEY,
  FOCUS_BOOKING_ID_KEY,
  FOCUS_BOOKING_REF_KEY,
} from "../../NotificationBookingSummaryModal";
import { findFocusBookingMatch } from "./useProfessionalFixedLocationCalendar.helpers";

/** Deep-link / sessionStorage focus → open existing booking (ponytail: effect slice). */
export function useProfessionalFixedLocationCalendarOpenExistingBookingFocus(input: {
  events: readonly CalendarEvent[];
  activeDateIso: string;
  setActiveDateIso: React.Dispatch<React.SetStateAction<string>>;
  openExistingBooking: (ev: CalendarEvent) => void;
}) {
  const { events, activeDateIso, setActiveDateIso, openExistingBooking } = input;
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusBookingHandledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const paramRef = searchParams?.get("bookingRef")?.trim() || "";
    const paramId = searchParams?.get("bookingId")?.trim() || "";
    const paramDate = searchParams?.get("date")?.trim() || "";
    const shouldOpen = searchParams?.get("open") === "1";

    let storedRef = "";
    let storedId = "";
    let storedDate = "";
    if (typeof window !== "undefined") {
      storedRef =
        window.sessionStorage.getItem(FOCUS_BOOKING_REF_KEY)?.trim() || "";
      storedId =
        window.sessionStorage.getItem(FOCUS_BOOKING_ID_KEY)?.trim() || "";
      storedDate =
        window.sessionStorage.getItem(FOCUS_BOOKING_DATE_KEY)?.trim() || "";
    }

    const focusRef = paramRef || storedRef;
    const focusId = paramId || storedId;
    const focusDate = paramDate || storedDate;

    if (!focusRef && !focusId) {
      focusBookingHandledRef.current = null;
      return;
    }
    if (!shouldOpen && !storedRef && !storedId) return;

    if (
      focusDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(focusDate) &&
      focusDate !== activeDateIso
    ) {
      setActiveDateIso(focusDate);
      return;
    }

    if (!events.length) return;

    const focusKey = `${focusRef}|${focusId}|${focusDate}`;
    if (focusBookingHandledRef.current === focusKey) return;

    const match = findFocusBookingMatch(events, focusRef, focusId);
    if (!match) return;

    focusBookingHandledRef.current = focusKey;
    openExistingBooking(match);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(FOCUS_BOOKING_REF_KEY);
      window.sessionStorage.removeItem(FOCUS_BOOKING_ID_KEY);
      window.sessionStorage.removeItem(FOCUS_BOOKING_DATE_KEY);
    }

    if (paramRef || paramId || shouldOpen || paramDate) {
      router.replace("/professionals/calendar", { scroll: false });
    }
  }, [
    activeDateIso,
    events,
    openExistingBooking,
    router,
    searchParams,
    setActiveDateIso,
  ]);

  return { focusBookingHandledRef };
}
