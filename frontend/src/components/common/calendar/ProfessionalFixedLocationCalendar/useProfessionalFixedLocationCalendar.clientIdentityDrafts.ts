import * as React from "react";
import type { GenderOption } from "../../../../lib/gender-options";

/** Guest / non-Mollure / phone drafts for the booking drawer (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarClientIdentityDrafts() {
  const [bookingPhoneDraft, setBookingPhoneDraft] = React.useState<{
    phoneCode: string;
    phoneNumber: string;
  }>(() => ({
    phoneCode: "",
    phoneNumber: "",
  }));
  const [guestDraft, setGuestDraft] = React.useState<{
    firstName: string;
    lastName: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
  }>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "",
    phoneNumber: "",
  }));
  const [nonMollureClientType, setNonMollureClientType] = React.useState<
    "" | "individual" | "company"
  >("");
  const [nonMollureDraft, setNonMollureDraft] = React.useState<{
    firstName: string;
    lastName: string;
    email: string;
    gender: "" | GenderOption;
    dob: string;
    phoneCode: string;
    phoneNumber: string;
    companyName: string;
    legalName: string;
    coc: string;
    vat: string;
    contactFirstName: string;
    contactLastName: string;
    street: string;
    streetNumber: string;
    postalCode: string;
    province: string;
    municipality: string;
  }>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    dob: "",
    phoneCode: "",
    phoneNumber: "",
    companyName: "",
    legalName: "",
    coc: "",
    vat: "",
    contactFirstName: "",
    contactLastName: "",
    street: "",
    streetNumber: "",
    postalCode: "",
    province: "",
    municipality: "",
  }));
  const [selectedClient, setSelectedClient] = React.useState<null | {
    name: string;
    email: string;
    mollureUserId?: string | null;
    clientKind?: "individual" | "company";
    isGuest?: boolean;
    isMollure?: boolean;
  }>(null);

  return {
    bookingPhoneDraft,
    setBookingPhoneDraft,
    guestDraft,
    setGuestDraft,
    nonMollureClientType,
    setNonMollureClientType,
    nonMollureDraft,
    setNonMollureDraft,
    selectedClient,
    setSelectedClient,
  };
}
