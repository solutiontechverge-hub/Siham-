/**
 * Run with:
 * npx --yes tsx src/components/common/calendar/ProfessionalFixedLocationCalendar/professionalBookingDrawerDraft.test.ts
 */
import assert from "node:assert/strict";
import {
  professionalBookingDrawerDraftHasContent,
  type ProfessionalBookingDrawerDraft,
} from "./professionalBookingDrawerDraft";

const empty = (): ProfessionalBookingDrawerDraft => ({
  selectedSlot: {
    resourceId: "r1",
    date: "2026-09-16",
    start: "08:00",
    end: "09:00",
    freeStart: "08:00",
    freeEnd: "18:00",
  },
  slotLocation: "FL",
  slotBookingType: "Online",
  slotStatus: "Requested",
  slotClientAdded: false,
  allowDrawerTimeSelection: false,
  slotCalendarTouched: true,
  selectedClient: null,
  selectedServices: [],
  selectedProducts: [],
  bookingUniqueItems: [],
  bookingGuests: [],
  bookingProjectEnabled: false,
  bookingProjectDescription: "",
  bookingProjectUploads: [],
  desiredLocationDraft: {
    street: "",
    number: "",
    postalCode: "",
    province: "",
    municipality: "",
  },
  showInternalNote: false,
  bookingInternalNote: "",
  showKilometerAllowance: false,
  kilometerAllowanceDraft: { eurPerKm: "", totalKilometer: "" },
  showPrepayment: false,
  prepaymentPercent: "",
  paymentMethod: "online",
  bookingTotalDiscount: null,
  showLateCancellation: false,
  lateCancellationFeePercent: "",
  lateCancellationFeePercentCeiling: "",
  showLateRescheduling: false,
  lateRescheduleFeePercent: "",
  lateRescheduleFeePercentCeiling: "",
  showNoShowFee: false,
  noShowFeePercent: "",
  noShowFeePercentCeiling: "",
  guestDraft: {
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "",
    phoneNumber: "",
  },
  bookingPhoneDraft: { phoneCode: "", phoneNumber: "" },
  nonMollureClientType: "",
  nonMollureDraft: {
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
  },
  selectionTarget: "client",
  addMenuTarget: "client",
  savedAt: "2026-09-15T00:00:00.000Z",
});

assert.equal(professionalBookingDrawerDraftHasContent(empty()), false);
assert.equal(
  professionalBookingDrawerDraftHasContent({
    ...empty(),
    selectedClient: { name: "Client", email: "a@b.c" },
  }),
  true,
);
assert.equal(
  professionalBookingDrawerDraftHasContent({
    ...empty(),
    selectedServices: [
      { id: "s1", name: "eyelash", price: 111, durationMins: 11 },
    ],
  }),
  true,
);

console.log("professionalBookingDrawerDraft.test.ts: all assertions passed");
