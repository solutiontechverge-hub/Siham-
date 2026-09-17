/**
 * Run with:
 * npx --yes tsx src/components/common/calendar/ProfessionalFixedLocationCalendar/useProfessionalFixedLocationCalendar.helpers.slotValidation.test.ts
 */
import assert from "node:assert/strict";
import {
  computeSlotValidation,
  type SlotValidationInput,
} from "./useProfessionalFixedLocationCalendar.helpers.slotValidation";

const baseGuestInput = (): SlotValidationInput => ({
  slotDrawerTab: "booking",
  slotBookingScreen: "guest",
  serviceEditDraft: {} as SlotValidationInput["serviceEditDraft"],
  serviceSelectionDraft: [],
  productSelectionDraft: {},
  uniqueItemSelectionDraft: {},
  uniqueItemDraft: {} as SlotValidationInput["uniqueItemDraft"],
  bufferDraft: {
    title: "",
    teamMemberIds: [],
    durationMins: "",
    startTime: "",
    endTime: "",
  },
  guestDraft: {
    firstName: "Jane",
    email: "jane@example.com",
    phoneCode: "+31",
    phoneNumber: "612345678",
  },
  nonMollureDraft: {
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    phoneCode: "",
    phoneNumber: "",
    email: "",
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
  slotClientAdded: false,
  selectedServicesLength: 0,
  selectedProductsLength: 0,
  bookingUniqueItemsLength: 0,
  guestsTotal: 0,
  addClientSource: "",
  bookingPhoneDraft: { phoneCode: "", phoneNumber: "" },
  paymentMethod: "offline",
});

{
  const result = computeSlotValidation(baseGuestInput());
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
}

{
  const input = baseGuestInput();
  input.guestDraft = {
    firstName: "",
    email: "",
    phoneCode: "",
    phoneNumber: "",
  };
  const result = computeSlotValidation(input);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.guestFirstName);
  assert.ok(result.errors.guestEmail);
  assert.ok(result.errors.guestPhoneCode || result.errors.guestPhoneNumber);
}

{
  const input = baseGuestInput();
  input.guestDraft.email = "not-an-email";
  const result = computeSlotValidation(input);
  assert.equal(result.isValid, false);
  assert.match(String(result.errors.guestEmail), /valid/i);
}

console.log("slotValidation guest required phone/email: ok");
