"use client";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningAddMenu from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningAddMenu";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocks from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocks";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBag = Pick<
  Vm,
  | "addMenuButtonRef"
  | "addMenuTarget"
  | "beginEditBuffer"
  | "beginEditInlineGuest"
  | "beginExistingBookingEdit"
  | "bookingGuests"
  | "canEditBookingLineItems"
  | "canMutateDrawerContents"
  | "cancelledServicesForDrawer"
  | "data"
  | "drawerOrderedBlocks"
  | "drawerParticipantOrdinals"
  | "drawerPlanningGuests"
  | "editingInlineGuestId"
  | "emptyInlineGuestDraft"
  | "firstDrawerPlanningId"
  | "incomingRequestEditMode"
  | "isViewingExisting"
  | "m"
  | "openDrawerLineTagComparison"
  | "openEditBookingProductLine"
  | "openEditBookingUniqueLine"
  | "openEditServiceFromLineItem"
  | "openSelectProducts"
  | "openSelectServices"
  | "openSelectUniqueItems"
  | "removeClientService"
  | "removeGuestService"
  | "renderInlineGuestFields"
  | "reorderClientServices"
  | "reorderDrawerPlanning"
  | "reorderGuestServices"
  | "resolveProductEditTag"
  | "resolveServiceEditTag"
  | "resourceNameById"
  | "selectedClient"
  | "selectedSlot"
  | "setAddMenuTarget"
  | "setBookingGuests"
  | "setEditingInlineGuestId"
  | "setInlineGuestDraft"
  | "setShowInlineGuestField"
  | "setSlotAddMenuAnchor"
  | "showClientRemoveButton"
  | "showInlineGuestField"
  | "showLineItemRemoveButton"
  | "silentFieldUpdates"
  | "slotAddMenuAnchor"
  | "theme"
  | "viewingBookingEvent"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBag;
};

/** Add menu, planning groups, people, inline guest */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanning({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningProps) {
  return (
    <>
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningAddMenu bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsPlanningBlocks bag={bag} />
    </>
  );
}
