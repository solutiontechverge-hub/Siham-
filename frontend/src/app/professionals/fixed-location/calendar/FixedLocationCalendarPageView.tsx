"use client";

import ProfessionalFixedLocationCalendar from "../../../../components/common/ProfessionalFixedLocationCalendar";
import { useFixedLocationCalendarPage } from "./useFixedLocationCalendarPage";

export default function FixedLocationCalendarPageView() {
  const {
    calendarData,
    handleOverviewDateRangeChange,
    calendarSettings,
    serviceOptions,
    categoryOptions,
    templateCategoryRows,
    serviceNameToCategoryKey,
    serviceCatalog,
    serviceOrderDefaults,
    clientOptions,
    professionalClients,
    fixedLocationAddress,
    lateRescheduleFeePercentDefault,
    lateCancellationFeePercentDefault,
    noShowFeePercentDefault,
    prepaymentPercentDefault,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    responseTimeHours,
    responseTimeMinutes,
    desiredLocationSetup,
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
      categoryOptions={categoryOptions}
      templateCategoryRows={templateCategoryRows}
      serviceNameToCategoryKey={serviceNameToCategoryKey}
      serviceCatalog={serviceCatalog}
      serviceOrderDefaults={serviceOrderDefaults}
      clientOptions={clientOptions}
      professionalClients={professionalClients}
      fixedLocationAddress={fixedLocationAddress}
      lateRescheduleFeePercentDefault={lateRescheduleFeePercentDefault}
      lateCancellationFeePercentDefault={lateCancellationFeePercentDefault}
      noShowFeePercentDefault={noShowFeePercentDefault}
      prepaymentPercentDefault={prepaymentPercentDefault}
      cancellationBeforeHours={cancellationBeforeHours}
      cancellationBeforeMinutes={cancellationBeforeMinutes}
      responseTimeHours={responseTimeHours}
      responseTimeMinutes={responseTimeMinutes}
      desiredLocationSetup={desiredLocationSetup}
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
