"use client";

import ProfessionalFixedLocationCalendar from "../../../../components/common/ProfessionalFixedLocationCalendar";
import { useFixedLocationCalendarPage } from "./useFixedLocationCalendarPage";

export default function FixedLocationCalendarPageView() {
  const {
    calendarData,
    handleOverviewDateRangeChange,
    calendarSettings,
    serviceOptions,
    serviceCatalog,
    serviceOrderDefaults,
    clientOptions,
    platformClientOptions,
    fixedLocationAddress,
    lateRescheduleFeePercentDefault,
    isSaving,
    onCreateCalendarEntry,
    onDeleteCalendarEntry,
    onSaveCalendarSettings,
    onSyncServiceOrderToSetup,
    onUpdateBookingStatus,
    onDispatchBookingNotification,
    onUpdateCalendarEntryStatus,
  } = useFixedLocationCalendarPage();

  return (
    <ProfessionalFixedLocationCalendar
      data={calendarData}
      onDateRangeChange={handleOverviewDateRangeChange}
      calendarSettings={calendarSettings}
      serviceOptions={serviceOptions}
      serviceCatalog={serviceCatalog}
      serviceOrderDefaults={serviceOrderDefaults}
      clientOptions={clientOptions}
      platformClientOptions={platformClientOptions}
      fixedLocationAddress={fixedLocationAddress}
      lateRescheduleFeePercentDefault={lateRescheduleFeePercentDefault}
      isSaving={isSaving}
      onCreateCalendarEntry={onCreateCalendarEntry}
      onDeleteCalendarEntry={onDeleteCalendarEntry}
      onSaveCalendarSettings={onSaveCalendarSettings}
      onSyncServiceOrderToSetup={onSyncServiceOrderToSetup}
      onUpdateBookingStatus={onUpdateBookingStatus}
      onDispatchBookingNotification={onDispatchBookingNotification}
      onUpdateCalendarEntryStatus={onUpdateCalendarEntryStatus}
    />
  );
}
