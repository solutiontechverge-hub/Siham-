import * as React from "react";
import { FIXED_LOCATION_MAX_GUESTS } from "../../../../app/clients/booking/booking.page.data";
import { getOptionalPhoneValidationErrors } from "../../../../lib/phone-validation";
import type { UseProfessionalFixedLocationCalendarDrawerGuestsArgs } from "./useProfessionalFixedLocationCalendar.drawerGuests";

/** Inline guest add/edit/cancel handlers (ponytail: subdomain of drawerGuests). */
export function useProfessionalFixedLocationCalendarDrawerGuestsInline(
  args: UseProfessionalFixedLocationCalendarDrawerGuestsArgs,
) {
  const {
    inlineGuestDraft,
    setInlineGuestDraft,
    emptyInlineGuestDraft,
    editingInlineGuestId,
    setEditingInlineGuestId,
    inlineGuestParticipantType,
    setInlineGuestParticipantType,
    setShowInlineGuestField,
    bookingGuests,
    setBookingGuests,
    slotLocation,
    focusBookingDrawerSection,
    showSnackbar,
  } = args;

  const addInlineGuest = React.useCallback(() => {
    const guestName =
      `${inlineGuestDraft.firstName.trim()} ${inlineGuestDraft.lastName.trim()}`.trim();
    const email = inlineGuestDraft.email.trim();
    const phoneCode = inlineGuestDraft.phoneCode;
    const phoneNumber = inlineGuestDraft.phoneNumber.trim();
    const phoneErrors = getOptionalPhoneValidationErrors(phoneCode, phoneNumber);
    if (phoneErrors.countryCode || phoneErrors.phone) {
      showSnackbar({
        severity: "warning",
        message: phoneErrors.phone || phoneErrors.countryCode || "Invalid phone.",
      });
      return;
    }

    if (editingInlineGuestId) {
      setBookingGuests((prev) =>
        prev.map((guest) => {
          if (guest.id !== editingInlineGuestId) return guest;
          const fallback =
            guest.participantType === "model" ? "Model" : "Guest";
          return {
            ...guest,
            name: guestName || guest.name || fallback,
            email,
            phoneCode,
            phoneNumber,
          };
        }),
      );
      setInlineGuestDraft(emptyInlineGuestDraft);
      setEditingInlineGuestId(null);
      setInlineGuestParticipantType("guest");
      setShowInlineGuestField(false);
      return;
    }

    if (
      slotLocation === "FL" &&
      inlineGuestParticipantType === "guest" &&
      bookingGuests.filter((g) => (g.participantType ?? "guest") === "guest")
        .length >= FIXED_LOCATION_MAX_GUESTS
    ) {
      return;
    }

    const modelCount =
      bookingGuests.filter((g) => g.participantType === "model").length + 1;
    const guestCount =
      bookingGuests.filter((g) => (g.participantType ?? "guest") === "guest")
        .length + 1;
    const fallbackName =
      inlineGuestParticipantType === "model"
        ? `Model ${modelCount}`
        : `Guest ${guestCount}`;
    const newGuestId = `guest-${Date.now()}`;
    setBookingGuests((prev) => [
      ...prev,
      {
        id: newGuestId,
        name: guestName || fallbackName,
        email,
        phoneCode,
        phoneNumber,
        services: [],
        products: [],
        participantType: inlineGuestParticipantType,
      },
    ]);
    setInlineGuestDraft(emptyInlineGuestDraft);
    setEditingInlineGuestId(null);
    setInlineGuestParticipantType("guest");
    setShowInlineGuestField(false);
    focusBookingDrawerSection(newGuestId);
  }, [
    bookingGuests,
    editingInlineGuestId,
    emptyInlineGuestDraft,
    inlineGuestDraft.email,
    inlineGuestDraft.firstName,
    inlineGuestDraft.lastName,
    inlineGuestDraft.phoneCode,
    inlineGuestDraft.phoneNumber,
    inlineGuestParticipantType,
    showSnackbar,
    slotLocation,
    focusBookingDrawerSection,
  ]);

  const beginEditInlineGuest = React.useCallback(
    (guest: {
      id: string;
      name: string;
      email?: string;
      phoneCode?: string;
      phoneNumber?: string;
      participantType?: string;
    }) => {
      const parts = guest.name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      setInlineGuestDraft({
        firstName,
        lastName,
        email: guest.email ?? "",
        phoneCode: guest.phoneCode ?? "",
        phoneNumber: guest.phoneNumber ?? "",
      });
      setEditingInlineGuestId(guest.id);
      setInlineGuestParticipantType(
        guest.participantType === "model" ? "model" : "guest",
      );
      setShowInlineGuestField(true);
    },
    [],
  );

  const cancelInlineGuestForm = React.useCallback(() => {
    setShowInlineGuestField(false);
    setEditingInlineGuestId(null);
    setInlineGuestDraft(emptyInlineGuestDraft);
  }, [emptyInlineGuestDraft]);

  return {
    addInlineGuest,
    beginEditInlineGuest,
    cancelInlineGuestForm,
  };
}
