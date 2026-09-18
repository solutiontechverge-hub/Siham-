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
    email: "",
    phoneCode: "",
    phoneNumber: "",
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
  assert.equal(result.errors.guestEmail, undefined);
  assert.equal(result.errors.guestPhoneCode, undefined);
  assert.equal(result.errors.guestPhoneNumber, undefined);
}

{
  // Email/phone no longer required on Add Guest screen (fields hidden).
  const input = baseGuestInput();
  input.guestDraft.email = "not-an-email";
  input.guestDraft.phoneNumber = "";
  const result = computeSlotValidation(input);
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
}

console.log("slotValidation guest first-name only: ok");
