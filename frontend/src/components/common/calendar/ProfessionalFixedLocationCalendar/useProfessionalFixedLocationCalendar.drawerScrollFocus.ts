import * as React from "react";
import type { SlotBookingScreen } from "./useProfessionalFixedLocationCalendar.types";

export type UseProfessionalFixedLocationCalendarDrawerScrollFocusArgs = {
  slotBookingScreen: SlotBookingScreen;
  addMenuTarget: "client" | string;
  showInlineGuestField: boolean;
  editingInlineGuestId: string | null;
  bookingGuests: readonly unknown[];
};

/** Booking drawer scroll restore + section focus (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarDrawerScrollFocus({
  slotBookingScreen,
  addMenuTarget,
  showInlineGuestField,
  editingInlineGuestId,
  bookingGuests,
}: UseProfessionalFixedLocationCalendarDrawerScrollFocusArgs) {
  const bookingDrawerBodyRef = React.useRef<HTMLDivElement | null>(null);
  const bookingDrawerScreenRef = React.useRef(slotBookingScreen);
  const savedBookingDrawerScrollTopRef = React.useRef(0);
  const pendingBookingDrawerFocusRef = React.useRef<string | null>(null);
  const restoreBookingDrawerScrollRef = React.useRef(false);

  React.useEffect(() => {
    const previousScreen = bookingDrawerScreenRef.current;
    bookingDrawerScreenRef.current = slotBookingScreen;
    if (previousScreen === "new-booking" && slotBookingScreen !== "new-booking") {
      savedBookingDrawerScrollTopRef.current =
        bookingDrawerBodyRef.current?.scrollTop ?? 0;
      restoreBookingDrawerScrollRef.current = true;
      if (!pendingBookingDrawerFocusRef.current) {
        pendingBookingDrawerFocusRef.current = addMenuTarget;
      }
    }
  }, [addMenuTarget, slotBookingScreen]);

  const focusBookingDrawerSection = React.useCallback((sectionId: string) => {
    pendingBookingDrawerFocusRef.current = sectionId;
    restoreBookingDrawerScrollRef.current = true;
  }, []);

  React.useEffect(() => {
    if (!showInlineGuestField || editingInlineGuestId) return;
    focusBookingDrawerSection("inline-participant-form");
  }, [editingInlineGuestId, focusBookingDrawerSection, showInlineGuestField]);

  React.useLayoutEffect(() => {
    if (slotBookingScreen !== "new-booking") return;
    if (!restoreBookingDrawerScrollRef.current) return;
    const scroller = bookingDrawerBodyRef.current;
    if (!scroller) return;
    const sectionId = pendingBookingDrawerFocusRef.current;
    const savedTop = savedBookingDrawerScrollTopRef.current;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        restoreBookingDrawerScrollRef.current = false;
        if (sectionId) {
          const escaped =
            typeof CSS !== "undefined" && typeof CSS.escape === "function"
              ? CSS.escape(sectionId)
              : sectionId.replace(/"/g, '\\"');
          const node = scroller.querySelector(
            `[data-booking-section="${escaped}"]`,
          );
          if (node) {
            node.scrollIntoView({ behavior: "smooth", block: "nearest" });
            pendingBookingDrawerFocusRef.current = null;
            return;
          }
        }
        if (savedTop > 0) scroller.scrollTop = savedTop;
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [bookingGuests, showInlineGuestField, slotBookingScreen]);

  return {
    bookingDrawerBodyRef,
    bookingDrawerScreenRef,
    focusBookingDrawerSection,
    pendingBookingDrawerFocusRef,
    restoreBookingDrawerScrollRef,
    savedBookingDrawerScrollTopRef,
  };
}
