import type { BookingServiceEditDraft } from "../../../../data/bookingServiceEdit.data";
import { getBookingServiceEditErrors } from "../../../../data/bookingServiceEdit.data";
import type { BookingProductSelectionDraft } from "../../../../data/bookingProductCatalog.data";
import type { BookingUniqueItemDraft } from "../../../../data/bookingUniqueItem.data";
import { getUniqueItemDraftErrors } from "../../../../data/bookingUniqueItem.data";
import { minutesSinceMidnight } from "../calendar.utils";
import {
  getOptionalPhoneValidationErrors,
  getPhoneValidationErrors,
} from "../../../../lib/phone-validation";

export type SlotValidationErrors = Partial<
  Record<
    | "nonMollureClientType"
    | "guestFirstName"
    | "guestLastName"
    | "guestPhoneCode"
    | "guestPhoneNumber"
    | "guestEmail"
    | "bookingClientEmail"
    | "nonMollureFirstName"
    | "nonMollureLastName"
    | "nonMollureGender"
    | "nonMollureDob"
    | "nonMollurePhoneCode"
    | "nonMollurePhoneNumber"
    | "nonMollureEmail"
    | "nonMollureLegalName"
    | "nonMollureCoc"
    | "nonMollureVat"
    | "nonMollureContactFirstName"
    | "nonMollureContactLastName"
    | "nonMollureStreet"
    | "nonMollureStreetNumber"
    | "nonMollurePostalCode"
    | "nonMollureProvince"
    | "nonMollureMunicipality"
    | "bookingClient"
    | "bookingPhoneCode"
    | "bookingPhoneNumber"
    | "uniqueItemProductName"
    | "uniqueItemPrice"
    | "bufferTitle"
    | "bufferDuration"
    | "bufferStartTime"
    | "bufferEndTime"
    | "bufferTeamMembers",
    string
  >
>;

export type SlotValidationInput = {
  slotDrawerTab: "booking" | "sales" | "activity";
  slotBookingScreen:
    | "new-booking"
    | "add-client-choice"
    | "non-mollure-individual"
    | "non-mollure-company"
    | "guest"
    | "select-services"
    | "edit-service"
    | "select-products"
    | "select-unique-items"
    | "add-unique-item"
    | "add-buffer";
  serviceEditDraft: BookingServiceEditDraft;
  serviceSelectionDraft: string[];
  productSelectionDraft: BookingProductSelectionDraft;
  uniqueItemSelectionDraft: BookingProductSelectionDraft;
  uniqueItemDraft: BookingUniqueItemDraft;
  bufferDraft: {
    title: string;
    teamMemberIds: string[];
    durationMins: string;
    startTime: string;
    endTime: string;
  };
  guestDraft: {
    firstName: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
  };
  nonMollureDraft: {
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    phoneCode: string;
    phoneNumber: string;
    email: string;
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
  };
  slotClientAdded: boolean;
  selectedServicesLength: number;
  selectedProductsLength: number;
  bookingUniqueItemsLength: number;
  guestsTotal: number;
  addClientSource: "" | "client-list" | "mollure-platform" | "non-mollure" | "guest";
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  paymentMethod: "online" | "offline";
  selectedClientEmail?: string;
};

export function computeSlotValidation(input: SlotValidationInput): {
  isValid: boolean;
  errors: SlotValidationErrors;
} {
  const isBlank = (v: string) => v.trim().length === 0;
  const errors: SlotValidationErrors = {};
  let isValid = true;

  if (input.slotDrawerTab !== "booking") {
    return { isValid: true as const, errors };
  }

  if (input.slotBookingScreen === "add-client-choice") {
    return { isValid: false as const, errors };
  }

  if (input.slotBookingScreen === "edit-service") {
    const editErrors = getBookingServiceEditErrors(input.serviceEditDraft);
    if (Object.keys(editErrors).length > 0) {
      isValid = false;
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "select-services") {
    if (input.serviceSelectionDraft.length === 0) {
      isValid = false;
      errors.bookingClient = "Select at least one service.";
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "select-products") {
    const hasSelected = Object.values(input.productSelectionDraft).some(
      (item) => item.selected,
    );
    if (!hasSelected) {
      isValid = false;
      errors.bookingClient = "Select at least one product.";
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "select-unique-items") {
    const hasSelected = Object.values(input.uniqueItemSelectionDraft).some(
      (item) => item.selected,
    );
    if (!hasSelected) {
      isValid = false;
      errors.bookingClient = "Select at least one unique item.";
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "add-unique-item") {
    const uniqueErrors = getUniqueItemDraftErrors(input.uniqueItemDraft);
    if (uniqueErrors.productName) {
      isValid = false;
      errors.uniqueItemProductName = uniqueErrors.productName;
    }
    if (uniqueErrors.price) {
      isValid = false;
      errors.uniqueItemPrice = uniqueErrors.price;
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "add-buffer") {
    if (isBlank(input.bufferDraft.title)) {
      isValid = false;
      errors.bufferTitle = "Title is required.";
    }
    if (isBlank(input.bufferDraft.startTime)) {
      isValid = false;
      errors.bufferStartTime = "Start time is required.";
    }
    if (isBlank(input.bufferDraft.endTime)) {
      isValid = false;
      errors.bufferEndTime = "End time is required.";
    } else if (
      input.bufferDraft.startTime &&
      minutesSinceMidnight(input.bufferDraft.endTime) <=
        minutesSinceMidnight(input.bufferDraft.startTime)
    ) {
      isValid = false;
      errors.bufferEndTime = "End time must be after start time.";
    }
    if (!input.bufferDraft.teamMemberIds.length) {
      isValid = false;
      errors.bufferTeamMembers = "Select at least one team member.";
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "guest") {
    if (isBlank(input.guestDraft.firstName)) {
      isValid = false;
      errors.guestFirstName = "First name is required.";
    }
    // ponytail: email/phone hidden on Add Guest UI; keep draft fields for API elsewhere
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "non-mollure-individual") {
    if (isBlank(input.nonMollureDraft.firstName)) {
      isValid = false;
      errors.nonMollureFirstName = "First name is required.";
    }
    if (isBlank(input.nonMollureDraft.lastName)) {
      isValid = false;
      errors.nonMollureLastName = "Last name is required.";
    }
    if (!input.nonMollureDraft.gender) {
      isValid = false;
      errors.nonMollureGender = "Gender is required.";
    }
    if (isBlank(input.nonMollureDraft.dob)) {
      isValid = false;
      errors.nonMollureDob = "Date of birth is required.";
    }
    const phoneErrors = getPhoneValidationErrors(
      input.nonMollureDraft.phoneCode,
      input.nonMollureDraft.phoneNumber,
    );
    if (phoneErrors.countryCode) {
      isValid = false;
      errors.nonMollurePhoneCode = phoneErrors.countryCode;
    }
    if (phoneErrors.phone) {
      isValid = false;
      errors.nonMollurePhoneNumber = phoneErrors.phone;
    }
    if (isBlank(input.nonMollureDraft.email)) {
      isValid = false;
      errors.nonMollureEmail = "Email is required.";
    }
    return { isValid, errors };
  }

  if (input.slotBookingScreen === "non-mollure-company") {
    if (isBlank(input.nonMollureDraft.legalName)) {
      isValid = false;
      errors.nonMollureLegalName = "Legal name is required.";
    }
    if (isBlank(input.nonMollureDraft.coc)) {
      isValid = false;
      errors.nonMollureCoc = "COC is required.";
    }
    if (isBlank(input.nonMollureDraft.vat)) {
      isValid = false;
      errors.nonMollureVat = "VAT is required.";
    }
    if (isBlank(input.nonMollureDraft.contactFirstName)) {
      isValid = false;
      errors.nonMollureContactFirstName = "Contact first name is required.";
    }
    if (isBlank(input.nonMollureDraft.contactLastName)) {
      isValid = false;
      errors.nonMollureContactLastName = "Contact last name is required.";
    }
    if (!input.nonMollureDraft.gender) {
      isValid = false;
      errors.nonMollureGender = "Gender is required.";
    }
    if (isBlank(input.nonMollureDraft.street)) {
      isValid = false;
      errors.nonMollureStreet = "Street is required.";
    }
    if (isBlank(input.nonMollureDraft.streetNumber)) {
      isValid = false;
      errors.nonMollureStreetNumber = "Number is required.";
    }
    if (isBlank(input.nonMollureDraft.postalCode)) {
      isValid = false;
      errors.nonMollurePostalCode = "Postal code is required.";
    }
    if (isBlank(input.nonMollureDraft.province)) {
      isValid = false;
      errors.nonMollureProvince = "Province is required.";
    }
    if (isBlank(input.nonMollureDraft.municipality)) {
      isValid = false;
      errors.nonMollureMunicipality = "Municipality is required.";
    }
    const companyPhoneErrors = getPhoneValidationErrors(
      input.nonMollureDraft.phoneCode,
      input.nonMollureDraft.phoneNumber,
    );
    if (companyPhoneErrors.countryCode) {
      isValid = false;
      errors.nonMollurePhoneCode = companyPhoneErrors.countryCode;
    }
    if (companyPhoneErrors.phone) {
      isValid = false;
      errors.nonMollurePhoneNumber = companyPhoneErrors.phone;
    }
    if (isBlank(input.nonMollureDraft.email)) {
      isValid = false;
      errors.nonMollureEmail = "Email is required.";
    }
    return { isValid, errors };
  }

  // new-booking
  if (!input.slotClientAdded) {
    isValid = false;
    errors.bookingClient = "Client is required.";
  }
  if (
    input.selectedServicesLength === 0 &&
    input.selectedProductsLength === 0 &&
    input.bookingUniqueItemsLength === 0 &&
    input.guestsTotal === 0
  ) {
    isValid = false;
    errors.bookingClient =
      errors.bookingClient ?? "Select at least one item/service or product.";
  }
  // Primary guest path keeps phone mandatory after attach; other clients stay optional.
  const bookingPhoneErrors =
    input.addClientSource === "guest"
      ? getPhoneValidationErrors(
          input.bookingPhoneDraft.phoneCode,
          input.bookingPhoneDraft.phoneNumber,
          { required: true },
        )
      : getOptionalPhoneValidationErrors(
          input.bookingPhoneDraft.phoneCode,
          input.bookingPhoneDraft.phoneNumber,
        );
  if (bookingPhoneErrors.countryCode) {
    isValid = false;
    errors.bookingPhoneCode = bookingPhoneErrors.countryCode;
  }
  if (bookingPhoneErrors.phone) {
    isValid = false;
    errors.bookingPhoneNumber = bookingPhoneErrors.phone;
  }
  if (input.paymentMethod === "online" && isBlank(input.selectedClientEmail ?? "")) {
    isValid = false;
    errors.bookingClientEmail = "Email is required for online payment.";
  }
  return { isValid, errors };
}
