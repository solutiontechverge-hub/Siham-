"use client";

import ProfessionalFixedLocationCalendarBookingDrawerSubScreens from "./ProfessionalFixedLocationCalendarBookingDrawerSubScreens";

import ProfessionalFixedLocationCalendarBookingDrawerDetails from "./ProfessionalFixedLocationCalendarBookingDrawerDetails";

import type { ProfessionalFixedLocationCalendarBookingDrawerBag } from "./ProfessionalFixedLocationCalendarBookingDrawer";

const SUB_SCREENS = new Set([
  "select-services",
  "edit-service",
  "select-products",
  "select-unique-items",
  "add-unique-item",
  "add-buffer",
  "add-client-choice",
  "non-mollure-individual",
  "non-mollure-company",
  "guest",
]);

export type ProfessionalFixedLocationCalendarBookingDrawerBookingTabBag =
  ProfessionalFixedLocationCalendarBookingDrawerBag;

export type ProfessionalFixedLocationCalendarBookingDrawerBookingTabProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerBookingTabBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerBookingTab({
  bag,
}: ProfessionalFixedLocationCalendarBookingDrawerBookingTabProps) {
  if (SUB_SCREENS.has(bag.slotBookingScreen)) {
    return (
      <ProfessionalFixedLocationCalendarBookingDrawerSubScreens bag={bag} />
    );
  }
  return <ProfessionalFixedLocationCalendarBookingDrawerDetails bag={bag} />;
}
