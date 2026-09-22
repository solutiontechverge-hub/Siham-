"use client";

import * as React from "react";
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useClientBookingCreatePage } from "./useClientBookingCreatePage";
import ClientBookingPlanningForm from "./ClientBookingPlanningForm";
import ClientBookingNotesForm from "./ClientBookingNotesForm";
import ClientBookingServicesDetailsPanel from "./ClientBookingServicesDetailsPanel";
import ClientBookingAddServiceDialog from "./ClientBookingAddServiceDialog";
import ClientBookingDateCalendarPanel from "./ClientBookingDateCalendarPanel";
import ClientBookingTimeSelectPanel from "./ClientBookingTimeSelectPanel";
import ClientBookingProjectDetailsPanel from "./ClientBookingProjectDetailsPanel";
import ClientBookingPeopleSection from "./ClientBookingPeopleSection";
import ClientBookingPaymentSummaryPanel from "./ClientBookingPaymentSummaryPanel";
import ClientTeamMemberPublicProfileDrawer, {
  type ClientTeamMemberPublicProfile,
} from "../../../components/common/client-booking/ClientTeamMemberPublicProfileDrawer";
import { getTeamForLocationMode, resolveDesiredVisitMunicipalityOptions } from "../../../data/businessPublicProfile.data";
import AppDropdown from "../../../components/common/AppDropdown";
import AppTextField from "../../../components/common/AppTextField";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";

export default function ClientBookingCreateView() {
  const page = useClientBookingCreatePage();
  const {
    fromProfile,
    profileHydrated,
    m,
    shop,
    isContinuing,
    today0,
    isPastDay,
    toISO,
    addDays,
    addMonths,
    selectedDate,
    setSelectedDate,
    monthPickerAnchor,
    setMonthPickerAnchor,
    weekDays,
    monthLabel,
    monthPickerYear,
    monthPickerMonth,
    setMonthYear,
    isDayNotAvailable,
    isDayUnselectable,
    getDayClosedNote,
    selectedDayNotAvailable,
    selectedDayClosedNote,
    times,
    availableTimes,
    isTimeUnavailable,
    timeScrollRef,
    scrollTimeSlots,
    people,
    draggingPersonId,
    setDraggingPersonId,
    selectedTime,
    setSelectedTime,
    timeValidationError,
    setTimeValidationError,
    selectedTimeTooSoon,
    bookServicesAtSameTime,
    selectedPersonId,
    setSelectedPersonId,
    selectedTeamMemberId,
    serviceTab,
    setServiceTab,
    selectedServiceIds,
    setSelectedServiceIds,
    addServiceDialogOpen,
    setAddServiceDialogOpen,
    addServiceCatalogIds,
    addServiceCatalogQty,
    toggleAddServiceCatalog,
    adjustAddServiceCatalogQty,
    projectDescription,
    setProjectDescription,
    projectUploads,
    participantMenuAnchor,
    setParticipantMenuAnchor,
    planningActivity,
    setPlanningActivity,
    planningDuration,
    setPlanningDuration,
    clientNote,
    setClientNote,
    projectFileInputRef,
    isDesiredLocation,
    minimumTimeslotNotice,
    isCompanyClient,
    bookingProjectEnabled,
    setBookingProjectEnabled,
    showProjectDetails,
    canAddPlanningParticipant,
    getParticipantLabel,
    isPlanningPerson,
    isPlanningCardSelected,
    isNotesCardSelected,
    hasNotesPerson,
    filteredTeamMembers,
    sharedTeamMemberOptions,
    getServiceTeamMemberOptions,
    canAddFixedLocationGuest,
    canAddService,
    addServiceCatalog,
    personCardSubtitle,
    updateGuestName,
    requiresPersonAssignment,
    allServicesAssigned,
    needsTeamMemberProvidedByPro,
    assigned,
    unassigned,
    isModelOrGuestSelected,
    canDirectAssign,
    visible,
    assignSelectedDirect,
    openAddServiceDialog,
    confirmAddService,
    applySharedTeamMember,
    updateServiceTeamMember,
    unassignService,
    removeService,
    toggleServiceSelection,
    onContinue,
    continueLabel,
    hasUnassigned,
    allVisibleSelected,
    someVisibleSelected,
    total,
    bookingStartMinutes,
    bookingEndMinutes,
    resolveServiceTeamMemberId,
    resolveServiceTeamMemberName,
    summarySections,
    businessProfile,
    reorderPeople,
    selectPlanningCard,
    selectNonPlanningPerson,
    addParticipant,
    savePlanning,
    startPlanningEdit,
    planningFormIsLocked,
    handleProjectFilePick,
    deleteProjectUpload,
    deleteGuest,
    combineServices,
    setCombineServices,
    isConfirmedEbrEdit,
    desiredVisitAddress,
    setDesiredVisitAddress,
  } = page;

  const summaryShopName = shop?.shopName?.trim() || "Salon";
  const [profileMemberId, setProfileMemberId] = React.useState<string | null>(
    null,
  );
  const summaryTeamMemberName = [
    ...new Set(
      page.services
        .map((s) => resolveServiceTeamMemberName(s))
        .filter((name): name is string => Boolean(name)),
    ),
  ].join(", ");
  const desiredTeamMemberFullName = isDesiredLocation
    ? filteredTeamMembers.find((tm) => tm.id === selectedTeamMemberId)?.name
        ?.trim() ||
      summaryTeamMemberName.split(",")[0]?.trim() ||
      ""
    : "";
  const openTeamMemberProfile = React.useCallback((teamMemberId: string) => {
    const id = String(teamMemberId ?? "").trim();
    if (id) setProfileMemberId(id);
  }, []);
  const profileMember = React.useMemo<ClientTeamMemberPublicProfile | null>(() => {
    const id = String(profileMemberId ?? "").trim();
    if (!id) return null;
    const locationTeam = businessProfile
      ? getTeamForLocationMode(businessProfile, shop?.locationMode ?? "fixed")
      : [];
    const fromProfile =
      locationTeam.find((row) => row.id === id) ||
      businessProfile?.teamMembers.find((row) => row.id === id);
    const fallbackName =
      filteredTeamMembers.find((tm) => tm.id === id)?.name?.trim() ||
      page.shopTeamMembers.find((tm) => tm.id === id)?.name?.trim() ||
      "";
    if (!fromProfile && !fallbackName) return null;
    const serviceLabels = [
      ...new Set(
        (fromProfile?.serviceSlots ?? []).flatMap((slot) =>
          slot.options.map((opt) => String(opt.label ?? "").trim()).filter(Boolean),
        ),
      ),
    ];
    return {
      id,
      name: fromProfile?.name?.trim() || fallbackName,
      avatarUrl: fromProfile?.avatarUrl,
      rating: fromProfile?.rating,
      reviewsCount: fromProfile?.reviewsCount,
      serviceLabels: serviceLabels.length ? serviceLabels : undefined,
    };
  }, [
    businessProfile,
    filteredTeamMembers,
    page.shopTeamMembers,
    profileMemberId,
    shop?.locationMode,
  ]);
  if (fromProfile && !profileHydrated) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "mollure.pageBg",
        py: { xs: 2, md: 3.5 },
      }}
    >
      <Container maxWidth="lg">
        <ClientBookingAddServiceDialog
          open={addServiceDialogOpen}
          onClose={() => setAddServiceDialogOpen(false)}
          onConfirm={confirmAddService}
          catalog={addServiceCatalog}
          selectedIds={addServiceCatalogIds}
          qtyById={addServiceCatalogQty}
          onToggle={toggleAddServiceCatalog}
          onAdjustQty={adjustAddServiceCatalogQty}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            // Keep visible so sticky participant actions can pin while scrolling.
            overflow: "visible",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: "#333333",
                fontSize: { xs: 22, sm: 26, md: 30 },
              }}
            >
              Booking Details
            </Typography>
          </Box>
          <Divider />

          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Grid container spacing={2} alignItems="stretch">
              <Grid item xs={12} md={8.2}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.16)}`,
                    overflow: "hidden",
                    bgcolor: "#fff",
                  }}
                >
                  <ClientBookingDateCalendarPanel
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    addMonths={addMonths}
                    addDays={addDays}
                    isPastDay={isPastDay}
                    today0={today0}
                    toISO={toISO}
                    monthPickerAnchor={monthPickerAnchor}
                    setMonthPickerAnchor={setMonthPickerAnchor}
                    monthLabel={monthLabel}
                    monthPickerYear={monthPickerYear}
                    monthPickerMonth={monthPickerMonth}
                    setMonthYear={setMonthYear}
                    weekDays={weekDays}
                    isDayNotAvailable={isDayNotAvailable}
                    isDayUnselectable={isDayUnselectable}
                    getDayClosedNote={getDayClosedNote}
                  />
                  <Divider />

                  <ClientBookingTimeSelectPanel
                    times={times}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                    isTimeUnavailable={isTimeUnavailable}
                    timeScrollRef={timeScrollRef}
                    scrollTimeSlots={scrollTimeSlots}
                    timeValidationError={timeValidationError}
                    setTimeValidationError={setTimeValidationError}
                    selectedTimeTooSoon={selectedTimeTooSoon}
                    selectedDayNotAvailable={selectedDayNotAvailable}
                    selectedDayClosedNote={selectedDayClosedNote}
                    availableTimes={availableTimes}
                  />
                </Paper>

                {isConfirmedEbrEdit && isDesiredLocation ? (
                  <Box
                    id="booking-location-section"
                    sx={{
                      mt: 1.25,
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.16)}`,
                      bgcolor: "#fff",
                      px: { xs: 1.5, md: 2 },
                      py: 1.75,
                    }}
                  >
                    <Typography
                      sx={mollureLabelSx(m.navy, {
                        fontWeight: 900,
                        fontSize: 14,
                        mb: 1.5,
                      })}
                    >
                      Desired Location
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        columnGap: 1.25,
                        rowGap: 1.35,
                      }}
                    >
                      {(
                        [
                          ["street", "Street Address", "Churchill-laan"],
                          ["number", "Street Number", "34234"],
                          ["postalCode", "Postal Code", "1234 AB"],
                        ] as const
                      ).map(([key, label, placeholder]) => (
                        <Box key={key}>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: alpha(m.navy, 0.65),
                              mb: 0.75,
                            }}
                          >
                            {label}
                          </Typography>
                          <AppTextField
                            value={desiredVisitAddress[key]}
                            onChange={(e) =>
                              setDesiredVisitAddress((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={placeholder}
                            fullWidth
                            size="small"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: 40,
                                minHeight: 40,
                              },
                            }}
                          />
                        </Box>
                      ))}
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.65),
                            mb: 0.75,
                          }}
                        >
                          Municipality
                        </Typography>
                        <AppDropdown
                          value={desiredVisitAddress.municipality}
                          onChange={(val) =>
                            setDesiredVisitAddress((prev) => ({
                              ...prev,
                              municipality: String(val ?? ""),
                              province: "",
                            }))
                          }
                          options={resolveDesiredVisitMunicipalityOptions(
                            businessProfile?.desiredLocation,
                          ).map((muni) => ({ value: muni, label: muni }))}
                          placeholder="Municipality"
                          fullWidth
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              height: 40,
                              minHeight: 40,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ) : null}

                {!isConfirmedEbrEdit ? (
                  <>
                    <ClientBookingProjectDetailsPanel
                      isDesiredLocation={isDesiredLocation}
                      isCompanyClient={isCompanyClient}
                      bookingProjectEnabled={bookingProjectEnabled}
                      setBookingProjectEnabled={setBookingProjectEnabled}
                      showProjectDetails={showProjectDetails}
                      projectDescription={projectDescription}
                      setProjectDescription={setProjectDescription}
                      projectFileInputRef={projectFileInputRef}
                      handleProjectFilePick={handleProjectFilePick}
                      projectUploads={projectUploads}
                      deleteProjectUpload={deleteProjectUpload}
                    />

                    <Box id="booking-services-section" sx={{ mt: 1.25, p: 0.25 }}>
                      <ClientBookingPeopleSection
                        isDesiredLocation={isDesiredLocation}
                        canAddFixedLocationGuest={canAddFixedLocationGuest}
                        isCompanyClient={isCompanyClient}
                        bookingProjectEnabled={bookingProjectEnabled}
                        participantMenuAnchor={participantMenuAnchor}
                        setParticipantMenuAnchor={setParticipantMenuAnchor}
                        addParticipant={addParticipant}
                        hasNotesPerson={hasNotesPerson}
                        canAddPlanningParticipant={canAddPlanningParticipant}
                        people={people}
                        selectedPersonId={selectedPersonId}
                        draggingPersonId={draggingPersonId}
                        setDraggingPersonId={setDraggingPersonId}
                        reorderPeople={reorderPeople}
                        isPlanningPerson={isPlanningPerson}
                        selectPlanningCard={selectPlanningCard}
                        setSelectedPersonId={setSelectedPersonId}
                        selectNonPlanningPerson={selectNonPlanningPerson}
                        deleteGuest={deleteGuest}
                        updateGuestName={updateGuestName}
                        getParticipantLabel={getParticipantLabel}
                        personCardSubtitle={personCardSubtitle}
                        minimumTimeslotNotice={minimumTimeslotNotice}
                        requiresPersonAssignment={requiresPersonAssignment}
                        isNotesCardSelected={isNotesCardSelected}
                        showCombineServices={!isDesiredLocation}
                        combineServices={combineServices}
                        setCombineServices={setCombineServices}
                        servicesCount={page.services.length}
                      />

                      {isDesiredLocation && isPlanningCardSelected ? (
                        <ClientBookingPlanningForm
                          planningActivity={planningActivity}
                          setPlanningActivity={setPlanningActivity}
                          planningDuration={planningDuration}
                          setPlanningDuration={setPlanningDuration}
                          planningFormIsLocked={planningFormIsLocked}
                          startPlanningEdit={startPlanningEdit}
                          savePlanning={savePlanning}
                        />
                      ) : isNotesCardSelected ? (
                        <ClientBookingNotesForm
                          clientNote={clientNote}
                          setClientNote={setClientNote}
                        />
                      ) : (
                        <>
                          <Divider sx={{ my: 1.5 }} />
                          <ClientBookingServicesDetailsPanel
                            serviceTab={serviceTab}
                            setServiceTab={setServiceTab}
                            setSelectedServiceIds={setSelectedServiceIds}
                            assigned={assigned}
                            unassigned={unassigned}
                            filteredTeamMembers={filteredTeamMembers}
                            isDesiredLocation={isDesiredLocation}
                            selectedTeamMemberId={selectedTeamMemberId}
                            applySharedTeamMember={applySharedTeamMember}
                            sharedTeamMemberOptions={sharedTeamMemberOptions}
                            hasUnassigned={hasUnassigned}
                            visible={visible}
                            allVisibleSelected={allVisibleSelected}
                            someVisibleSelected={someVisibleSelected}
                            unassignService={unassignService}
                            updateServiceTeamMember={updateServiceTeamMember}
                            getServiceTeamMemberOptions={getServiceTeamMemberOptions}
                            selectedServiceIds={selectedServiceIds}
                            toggleServiceSelection={toggleServiceSelection}
                            removeService={removeService}
                            isModelOrGuestSelected={isModelOrGuestSelected}
                            canDirectAssign={canDirectAssign}
                            assignSelectedDirect={assignSelectedDirect}
                            openAddServiceDialog={openAddServiceDialog}
                            canAddService={canAddService}
                          />
                        </>
                      )}
                    </Box>
                  </>
                ) : null}
              </Grid>

              <Grid item xs={12} md={3.8}>
                <ClientBookingPaymentSummaryPanel
                  summaryShopName={summaryShopName}
                  selectedDate={selectedDate}
                  bookingStartMinutes={bookingStartMinutes}
                  bookingEndMinutes={bookingEndMinutes}
                  isDesiredLocation={isDesiredLocation}
                  desiredTeamMemberFullName={desiredTeamMemberFullName}
                  summarySections={summarySections}
                  clientNote={clientNote}
                  bookServicesAtSameTime={bookServicesAtSameTime}
                  resolveServiceTeamMemberName={resolveServiceTeamMemberName}
                  resolveServiceTeamMemberId={resolveServiceTeamMemberId}
                  onTeamMemberClick={openTeamMemberProfile}
                  total={total}
                  allServicesAssigned={allServicesAssigned}
                  servicesCount={page.services.length}
                  unassigned={unassigned}
                  needsTeamMemberProvidedByPro={needsTeamMemberProvidedByPro}
                  selectedTeamMemberId={selectedTeamMemberId}
                  selectedTimeTooSoon={selectedTimeTooSoon}
                  isContinuing={isContinuing}
                  onContinue={onContinue}
                  continueLabel={continueLabel}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
      <ClientTeamMemberPublicProfileDrawer
        open={Boolean(profileMemberId)}
        onClose={() => setProfileMemberId(null)}
        shopId={shop?.shopId}
        member={profileMember}
      />
    </Box>
  );
}
