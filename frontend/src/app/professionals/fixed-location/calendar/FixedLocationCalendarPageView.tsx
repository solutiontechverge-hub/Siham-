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
    fixedLocationAddress,
    lateRescheduleFeePercentDefault,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    isSaving,
    onCreateCalendarEntry,
    onUpdateCalendarEntry,
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
      fixedLocationAddress={fixedLocationAddress}
      lateRescheduleFeePercentDefault={lateRescheduleFeePercentDefault}
      cancellationBeforeHours={cancellationBeforeHours}
      cancellationBeforeMinutes={cancellationBeforeMinutes}
      isSaving={isSaving}
      onCreateCalendarEntry={onCreateCalendarEntry}
      onUpdateCalendarEntry={onUpdateCalendarEntry}
      onDeleteCalendarEntry={onDeleteCalendarEntry}
      onSaveCalendarSettings={onSaveCalendarSettings}
      onSyncServiceOrderToSetup={onSyncServiceOrderToSetup}
      onUpdateBookingStatus={onUpdateBookingStatus}
      onDispatchBookingNotification={onDispatchBookingNotification}
      onUpdateCalendarEntryStatus={onUpdateCalendarEntryStatus}
    />
  );
}
