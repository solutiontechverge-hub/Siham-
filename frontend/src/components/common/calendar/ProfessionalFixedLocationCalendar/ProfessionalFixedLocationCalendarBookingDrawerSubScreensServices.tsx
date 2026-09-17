"use client";

import BookingSelectServicesScreen from "../BookingSelectServicesScreen";

import BookingEditServiceScreen from "../BookingEditServiceScreen";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensServicesBag = Pick<
  Vm,
  | "editServiceAvailabilitySlots"
  | "incomingRequestEditMode"
  | "isViewingExisting"
  | "selectableServiceCategories"
  | "serviceEditDraft"
  | "serviceEditErrors"
  | "serviceOverridesDraft"
  | "serviceSelectionDraft"
  | "setServiceEditDraft"
  | "toggleServiceSelectionDraft"
>;

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensServicesBag };

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensSelectServices({ bag }: Props) {
  const {
    isViewingExisting,
    selectableServiceCategories,
    serviceOverridesDraft,
    serviceSelectionDraft,
    toggleServiceSelectionDraft,
  } = bag;

  return (
      <BookingSelectServicesScreen
        catalog={selectableServiceCategories}
        selectedIds={serviceSelectionDraft}
        serviceOverrides={serviceOverridesDraft}
        onToggle={(service) =>
          toggleServiceSelectionDraft(service.id)
        }
        disabled={isViewingExisting}
      />
  );
}

export function ProfessionalFixedLocationCalendarBookingDrawerSubScreensEditService({ bag }: Props) {
  const {
    editServiceAvailabilitySlots,
    incomingRequestEditMode,
    isViewingExisting,
    serviceEditDraft,
    serviceEditErrors,
    setServiceEditDraft,
  } = bag;

  return (
      <BookingEditServiceScreen
        draft={serviceEditDraft}
        errors={serviceEditErrors}
        onChange={(patch) =>
          setServiceEditDraft((prev) => ({ ...prev, ...patch }))
        }
        disabled={isViewingExisting}
        availabilitySlots={editServiceAvailabilitySlots}
        showAvailability={
          !isViewingExisting || incomingRequestEditMode
        }
      />
  );
}
