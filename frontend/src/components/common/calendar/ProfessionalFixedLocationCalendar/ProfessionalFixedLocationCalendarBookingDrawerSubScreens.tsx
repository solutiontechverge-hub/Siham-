"use client";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import {
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectServices,
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensEditService,
} from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensServices";

import {
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectProducts,
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectUniqueItems,
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddUniqueItem,
} from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensProducts";

import ProfessionalFixedLocationCalendarBookingDrawerSubScreensBuffer from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensBuffer";

import ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddClient from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddClient";

import {
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureIndividual,
  ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureCompany,
} from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollure";

import ProfessionalFixedLocationCalendarBookingDrawerSubScreensGuest from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreensGuest";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensBag = Pick<
  Vm,
  | "addClientSource"
  | "adjustProductQuantityDraft"
  | "adjustUniqueItemQuantityDraft"
  | "bufferDraft"
  | "clientList"
  | "clientListSelectedEmail"
  | "data"
  | "editServiceAvailabilitySlots"
  | "editingBufferId"
  | "editingCatalogProductId"
  | "guestDraft"
  | "incomingRequestEditMode"
  | "isViewingExisting"
  | "m"
  | "mergedCustomBookingProducts"
  | "nonMollureClientType"
  | "nonMollureDraft"
  | "openAddProduct"
  | "openAddUniqueItem"
  | "persistedUniqueCatalog"
  | "platformEmailInput"
  | "platformEmailMatch"
  | "platformLookupStatus"
  | "productCatalog"
  | "productSelectionDraft"
  | "selectableServiceCategories"
  | "serviceEditDraft"
  | "serviceEditErrors"
  | "serviceOverridesDraft"
  | "serviceSelectionDraft"
  | "setAddClientSource"
  | "setBookingPhoneDraft"
  | "setBufferDraft"
  | "setClientListSelectedEmail"
  | "setGuestDraft"
  | "setNonMollureClientType"
  | "setNonMollureDraft"
  | "setPaymentMethod"
  | "setPlatformEmailInput"
  | "setSelectedClient"
  | "setServiceEditDraft"
  | "setSlotBookingScreen"
  | "setSlotClientAdded"
  | "setUniqueItemDraft"
  | "slotBookingScreen"
  | "slotErrors"
  | "theme"
  | "todayIso"
  | "toggleProductSelectionDraft"
  | "toggleServiceSelectionDraft"
  | "toggleUniqueItemSelectionDraft"
  | "uniqueItemDraft"
  | "uniqueItemFlowNamePlaceholder"
  | "uniqueItemFlowTitle"
  | "uniqueItemSelectionDraft"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerSubScreens({ bag }: ProfessionalFixedLocationCalendarBookingDrawerSubScreensProps) {
  const { slotBookingScreen } = bag;

  return (
    slotBookingScreen === "select-services" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectServices bag={bag} />
    ) : slotBookingScreen === "edit-service" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensEditService bag={bag} />
    ) : slotBookingScreen === "select-products" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectProducts bag={bag} />
    ) : slotBookingScreen === "select-unique-items" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectUniqueItems bag={bag} />
    ) : slotBookingScreen === "add-unique-item" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddUniqueItem bag={bag} />
    ) : slotBookingScreen === "add-buffer" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensBuffer bag={bag} />
    ) : slotBookingScreen === "add-client-choice" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensAddClient bag={bag} />
    ) : slotBookingScreen === "non-mollure-individual" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureIndividual bag={bag} />
    ) : slotBookingScreen === "non-mollure-company" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensNonMollureCompany bag={bag} />
    ) : slotBookingScreen === "guest" ? (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreensGuest bag={bag} />
    ) : null
  );
}
