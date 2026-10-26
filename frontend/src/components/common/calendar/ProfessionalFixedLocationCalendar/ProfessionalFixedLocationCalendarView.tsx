"use client";

import * as React from "react";
import { Box, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AppPillTabs from "../../AppPillTabs";
import {
  useGetFinanceTransactionsQuery,
  useGetSalesCardMetadataQuery,
  useProcessFinanceInvoiceReissuesMutation,
} from "../../../../store/services/financeApi";
import { FinancePaymentDueRowsProvider } from "../resolveBookingPaymentDueMeta";
import { hydrateSalesCardMetadata } from "../salesOverview.storage";
import type { SalesCardMetaRecord } from "../salesOverview.types";
import type { CalendarSubTab } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  useProfessionalFixedLocationCalendar,
  type ProfessionalFixedLocationCalendarProps,
} from "./useProfessionalFixedLocationCalendar";
import ProfessionalFixedLocationCalendarMonthGrid from "./ProfessionalFixedLocationCalendarMonthGrid";
import ProfessionalFixedLocationCalendarOverviewToolbar from "./ProfessionalFixedLocationCalendarOverviewToolbar";
import ProfessionalFixedLocationCalendarScheduleTab from "./ProfessionalFixedLocationCalendarScheduleTab";
import ProfessionalFixedLocationCalendarSettingsTab from "./ProfessionalFixedLocationCalendarSettingsTab";
import ProfessionalFixedLocationCalendarDayWeekView from "./ProfessionalFixedLocationCalendarDayWeekView";
import ProfessionalFixedLocationCalendarBookingDrawer from "./ProfessionalFixedLocationCalendarBookingDrawer";
import ProfessionalFixedLocationCalendarOverlays from "./ProfessionalFixedLocationCalendarOverlays";

export type { ProfessionalFixedLocationCalendarProps };

export default function ProfessionalFixedLocationCalendar(
  props: ProfessionalFixedLocationCalendarProps,
) {
  const vm = useProfessionalFixedLocationCalendar(props);
  const { data: financeResponse } = useGetFinanceTransactionsQuery(
    { limit: 500 },
    { refetchOnMountOrArgChange: true, pollingInterval: 12_000 },
  );
  // Prefetch on calendar load (fixed + desired share this shell) so Booking
  // tab / cards show reissue due dates without visiting Sales first.
  const { data: salesMetadataResponse } = useGetSalesCardMetadataQuery(
    undefined,
    { refetchOnMountOrArgChange: true },
  );
  const [processFinanceInvoiceReissues] =
    useProcessFinanceInvoiceReissuesMutation();

  React.useEffect(() => {
    if (!salesMetadataResponse) return;
    hydrateSalesCardMetadata(
      (salesMetadataResponse.data ?? []) as SalesCardMetaRecord[],
    );
  }, [salesMetadataResponse]);

  React.useEffect(() => {
    void processFinanceInvoiceReissues();
  }, [processFinanceInvoiceReissues]);
  const {
    activeDateIso,
    activeMonthIso,
    activeResource,
    activeSubTab,
    addAnchor,
    addMenuBookingResourceId,
    appliedDesign,
    blocks,
    bookingRules,
    calendarSettings,
    categoryOptions,
    data,
    datePickerAnchor,
    endMin,
    events,
    getAvailabilityFor,
    grid,
    hasScheduleAvailabilityOnDate,
    isAddMenuBookingDisabled,
    isSaving,
    m,
    monthCells,
    nowMin,
    onCreateCalendarEntry,
    onDeleteCalendarEntry,
    onNext,
    onPrev,
    onSyncServiceOrderToSetup,
    onToday,
    openBookingDrawer,
    persistAvailabilitySettings,
    persistEventStatus,
    resetToDefaultTeamMember,
    resourceNameById,
    scheduleHydratedRef,
    scheduleResourceFilter,
    scheduleRows,
    serviceOrderDraft,
    setActiveDateIso,
    setActiveSubTab,
    setAddAnchor,
    setBlockDraft,
    setBlockTimeOpen,
    setBlocks,
    setBookingRules,
    setDatePickerAnchor,
    setDesignDraft,
    setDesignOpen,
    setEvents,
    setFiltersOpen,
    setPublicBusinessHoursDraft,
    setPublicBusinessHoursOpen,
    setScheduleResourceFilter,
    setScheduleRows,
    setSelectedResourceId,
    setServiceOrderDraft,
    setViewMode,
    showSnackbar,
    startMin,
    templateCategoryRows,
    todayIso,
    userPickedTeamMemberRef,
    viewMode,
  } = vm;

  return (
    <FinancePaymentDueRowsProvider rows={financeResponse?.data?.rows ?? []}>
      <Stack
      spacing={1.5}
      sx={{
        bgcolor: alpha(m.teal, 0.12),
        px: { xs: 1.25, md: 3 },
        py: { xs: 1.5, md: 2.5 },
        borderRadius: "2px",
      }}
    >
      <AppPillTabs
        tabs={data.subTabs.map((label) => ({ label }))}
        active={activeSubTab}
        onChange={(next) => setActiveSubTab(next as CalendarSubTab)}
        alignStart={false}
      />

      {activeSubTab === "Overview" ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "2px",
            border: 0,
            boxShadow: "none",
            bgcolor: "#fff",
            overflow: "hidden",
          }}
        >
          <ProfessionalFixedLocationCalendarOverviewToolbar
            activeDateIso={activeDateIso}
            activeMonthIso={activeMonthIso}
            activeResource={activeResource}
            addAnchor={addAnchor}
            addMenuBookingResourceId={addMenuBookingResourceId}
            appliedDesign={appliedDesign}
            calendarSettings={calendarSettings}
            data={data}
            datePickerAnchor={datePickerAnchor}
            endMin={endMin}
            getAvailabilityFor={getAvailabilityFor}
            grid={grid}
            isAddMenuBookingDisabled={isAddMenuBookingDisabled}
            m={m}
            nowMin={nowMin}
            onNext={onNext}
            onPrev={onPrev}
            onToday={onToday}
            openBookingDrawer={openBookingDrawer}
            resetToDefaultTeamMember={resetToDefaultTeamMember}
            setActiveDateIso={setActiveDateIso}
            setAddAnchor={setAddAnchor}
            setBlockDraft={setBlockDraft}
            setBlockTimeOpen={setBlockTimeOpen}
            setDatePickerAnchor={setDatePickerAnchor}
            setDesignDraft={setDesignDraft}
            setDesignOpen={setDesignOpen}
            setFiltersOpen={setFiltersOpen}
            setPublicBusinessHoursDraft={setPublicBusinessHoursDraft}
            setPublicBusinessHoursOpen={setPublicBusinessHoursOpen}
            setSelectedResourceId={setSelectedResourceId}
            setViewMode={setViewMode}
            showSnackbar={showSnackbar}
            startMin={startMin}
            todayIso={todayIso}
            userPickedTeamMemberRef={userPickedTeamMemberRef}
            viewMode={viewMode}
          />

          <Box sx={{ px: { xs: 1.25, md: 2 }, pb: 2, bgcolor: "#fff" }}>
            {viewMode === "month" ? (
              <ProfessionalFixedLocationCalendarMonthGrid
                m={m}
                monthCells={monthCells}
                hasScheduleAvailabilityOnDate={hasScheduleAvailabilityOnDate}
                resourceNameById={resourceNameById}
                setActiveDateIso={setActiveDateIso}
                resetToDefaultTeamMember={resetToDefaultTeamMember}
                setViewMode={setViewMode}
              />
            ) : (
              <ProfessionalFixedLocationCalendarDayWeekView bag={vm} />
            )}
          </Box>
        </Paper>
      ) : null}

      {activeSubTab === "Schedule" ? (
        <ProfessionalFixedLocationCalendarScheduleTab
          activeDateIso={activeDateIso}
          blocks={blocks}
          data={data}
          events={events}
          isSaving={isSaving}
          onCreateCalendarEntry={onCreateCalendarEntry}
          onDeleteCalendarEntry={onDeleteCalendarEntry}
          persistAvailabilitySettings={persistAvailabilitySettings}
          persistEventStatus={persistEventStatus}
          scheduleHydratedRef={scheduleHydratedRef}
          scheduleResourceFilter={scheduleResourceFilter}
          scheduleRows={scheduleRows}
          setActiveDateIso={setActiveDateIso}
          setBlocks={setBlocks}
          setEvents={setEvents}
          setScheduleResourceFilter={setScheduleResourceFilter}
          setScheduleRows={setScheduleRows}
          showSnackbar={showSnackbar}
        />
      ) : null}

      {activeSubTab === "Settings" ? (
        <ProfessionalFixedLocationCalendarSettingsTab
          appliedDesign={appliedDesign}
          bookingRules={bookingRules}
          calendarSettings={calendarSettings}
          categoryOptions={categoryOptions}
          data={data}
          isSaving={isSaving}
          onSyncServiceOrderToSetup={onSyncServiceOrderToSetup}
          persistAvailabilitySettings={persistAvailabilitySettings}
          serviceOrderDraft={serviceOrderDraft}
          setBookingRules={setBookingRules}
          setDesignDraft={setDesignDraft}
          setDesignOpen={setDesignOpen}
          setPublicBusinessHoursDraft={setPublicBusinessHoursDraft}
          setPublicBusinessHoursOpen={setPublicBusinessHoursOpen}
          setServiceOrderDraft={setServiceOrderDraft}
          showSnackbar={showSnackbar}
          templateCategoryRows={templateCategoryRows}
        />
      ) : null}

      <ProfessionalFixedLocationCalendarBookingDrawer bag={vm} />
      <ProfessionalFixedLocationCalendarOverlays bag={vm} />
      </Stack>
    </FinancePaymentDueRowsProvider>
  );
}
