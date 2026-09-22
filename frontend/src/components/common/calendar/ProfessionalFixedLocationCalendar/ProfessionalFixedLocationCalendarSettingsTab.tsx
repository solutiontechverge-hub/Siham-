"use client";

import * as React from "react";
import CalendarHoursRulesPanel from "../CalendarHoursRulesPanel";
import {
  createEmptyPublicBusinessHoursDraft,
  draftFromPublicBusinessHoursEntries,
  locationHasPublicHoursConfigured,
} from "../CalendarPublicBusinessHoursModal";
import { withClampedDesiredLocationInterval } from "../calendar-settings.types";
import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarSettingsTabProps = Pick<
  Vm,
  | "appliedDesign"
  | "bookingRules"
  | "calendarSettings"
  | "categoryOptions"
  | "data"
  | "isSaving"
  | "onSyncServiceOrderToSetup"
  | "persistAvailabilitySettings"
  | "serviceOrderDraft"
  | "setBookingRules"
  | "setDesignDraft"
  | "setDesignOpen"
  | "setPublicBusinessHoursDraft"
  | "setPublicBusinessHoursOpen"
  | "setServiceOrderDraft"
  | "showSnackbar"
  | "templateCategoryRows"
>;

export default function ProfessionalFixedLocationCalendarSettingsTab(
  props: ProfessionalFixedLocationCalendarSettingsTabProps,
) {
  const {
    appliedDesign,
    bookingRules,
    calendarSettings,
    categoryOptions,
    data,
    isSaving,
    onSyncServiceOrderToSetup,
    persistAvailabilitySettings,
    serviceOrderDraft,
    setBookingRules,
    setDesignDraft,
    setDesignOpen,
    setPublicBusinessHoursDraft,
    setPublicBusinessHoursOpen,
    setServiceOrderDraft,
    showSnackbar,
    templateCategoryRows,
  } = props;

  return (
<CalendarHoursRulesPanel
  availableLocations={data.supportedLocations}
  bookingRules={bookingRules}
  publicBusinessHours={
    Array.isArray(calendarSettings?.availability.publicBusinessHours)
      ? calendarSettings.availability.publicBusinessHours
      : []
  }
  serviceOrder={serviceOrderDraft}
  appliedDesign={appliedDesign}
  categoryOptions={categoryOptions}
  templateCategoryRows={templateCategoryRows}
  isSaving={isSaving}
  onBookingRulesChange={setBookingRules}
  onServiceOrderChange={setServiceOrderDraft}
  onOpenDesign={() => {
    setDesignDraft(appliedDesign);
    setDesignOpen(true);
  }}
  onOpenPublicHours={(location) => {
    const existing = Array.isArray(
      calendarSettings?.availability.publicBusinessHours,
    )
      ? calendarSettings.availability.publicBusinessHours
      : [];
    if (location === "FL" || location === "DL") {
      setPublicBusinessHoursDraft(
        locationHasPublicHoursConfigured(existing, location)
          ? draftFromPublicBusinessHoursEntries(existing, location)
          : createEmptyPublicBusinessHoursDraft(location),
      );
    } else {
      setPublicBusinessHoursDraft(createEmptyPublicBusinessHoursDraft());
    }
    setPublicBusinessHoursOpen(true);
  }}
  onSaveBookingRules={async (next) => {
    const rules = withClampedDesiredLocationInterval(
      next ?? bookingRules,
    );
    setBookingRules(rules);
    await persistAvailabilitySettings({ bookingRules: rules });
    showSnackbar({
      severity: "success",
      message: "Booking rules saved.",
    });
  }}
  onSaveServiceOrder={async () => {
    await persistAvailabilitySettings({
      serviceOrder: serviceOrderDraft,
    });
    await onSyncServiceOrderToSetup?.(serviceOrderDraft);
    showSnackbar({
      severity: "success",
      message: "Service order saved.",
    });
  }}
/>
  );
}
