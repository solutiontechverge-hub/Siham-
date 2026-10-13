"use client";

import dynamic from "next/dynamic";
import DynamicChunkFallback from "../../../../components/common/DynamicChunkFallback";
import { useFixedLocationCalendarPage } from "./useFixedLocationCalendarPage";

const ProfessionalFixedLocationCalendar = dynamic(
  () => import("../../../../components/common/ProfessionalFixedLocationCalendar"),
  { ssr: false, loading: () => <DynamicChunkFallback /> },
);

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
    kilometerAllowanceEurPerKmDefault,
    appointmentBeforeHours,
    appointmentBeforeMinutes,
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
      kilometerAllowanceEurPerKmDefault={kilometerAllowanceEurPerKmDefault}
      appointmentBeforeHours={appointmentBeforeHours}
      appointmentBeforeMinutes={appointmentBeforeMinutes}
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
