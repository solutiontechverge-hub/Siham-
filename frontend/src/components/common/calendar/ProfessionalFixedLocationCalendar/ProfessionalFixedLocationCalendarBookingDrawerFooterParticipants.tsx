"use client";

import { Box } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import {
  findExternalStaffBookingOverlaps,
  findInternalStaffServiceOverlaps,
  type StaffServiceInterval,
} from "../calendar-overlap.utils";

import BookingDrawerParticipantActions from "../BookingDrawerParticipantActions";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerFooterParticipantsBag = Pick<
  Vm,
  | "addDlParticipant"
  | "beginExistingBookingEdit"
  | "bookingGuests"
  | "drawerParticipantKinds"
  | "editingEventId"
  | "editingInlineGuestId"
  | "events"
  | "isSelectedCompanyClient"
  | "isViewingExisting"
  | "m"
  | "openInlineGuestForm"
  | "selectedServices"
  | "selectedSlot"
  | "showInlineGuestField"
  | "slotBookingScreen"
  | "slotClientAdded"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerFooterParticipantsBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerFooterParticipants({
  bag,
}: Props) {
  const {
    addDlParticipant,
    beginExistingBookingEdit,
    bookingGuests,
    drawerParticipantKinds,
    editingEventId,
    editingInlineGuestId,
    events,
    isSelectedCompanyClient,
    isViewingExisting,
    m,
    openInlineGuestForm,
    selectedServices,
    selectedSlot,
    showInlineGuestField,
    slotBookingScreen,
    slotClientAdded,
  } = bag;

  if (slotBookingScreen !== "new-booking" || !slotClientAdded) return null;

  return (
    <Box sx={{ mb: 1.25 }}>
      {(() => {
        if (!selectedSlot || isViewingExisting) return null;
        const slotStart = selectedSlot.start.slice(0, 5);
        const slotEnd = selectedSlot.end.slice(0, 5);
        const staffIntervals: StaffServiceInterval[] = [
          ...selectedServices.map((service) => ({
            id: service.id,
            name: service.name,
            staffId: service.staffResourceId || selectedSlot.resourceId,
            start: (service.startTime || slotStart).slice(0, 5),
            end: (service.endTime || slotEnd).slice(0, 5),
          })),
          ...bookingGuests.flatMap((guest) =>
            guest.services.map((service) => ({
              id: `${guest.id}-${service.id}`,
              name: service.name,
              staffId: service.staffResourceId || selectedSlot.resourceId,
              start: (service.startTime || slotStart).slice(0, 5),
              end: (service.endTime || slotEnd).slice(0, 5),
            })),
          ),
          ...bookingGuests
            .filter(
              (guest) =>
                guest.participantType === "buffer" &&
                Boolean(guest.bufferStartTime) &&
                Boolean(guest.bufferEndTime),
            )
            .map((guest) => ({
              id: guest.id,
              name: guest.name || "Buffer",
              staffId: guest.bufferTeamMemberId || selectedSlot.resourceId,
              start: guest.bufferStartTime!.slice(0, 5),
              end: guest.bufferEndTime!.slice(0, 5),
            })),
        ];
        const hasInternal =
          findInternalStaffServiceOverlaps(staffIntervals).length > 0;
        const hasExternal =
          findExternalStaffBookingOverlaps({
            bookingId: editingEventId,
            date: selectedSlot.date,
            services: staffIntervals,
            events,
          }).length > 0;
        if (!hasInternal && !hasExternal) return null;
        return (
          <Box
            sx={{
              mb: 1,
              px: 1.25,
              py: 1,
              borderRadius: "10px",
              bgcolor: alpha(m.statusOrangeFg, 0.1),
              border: `1px solid ${alpha(m.statusOrangeFg, 0.28)}`,
            }}
          >
            <BodyText
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: m.statusOrangeFg,
                lineHeight: 1.35,
              }}
            >
              Overlapping staff time detected. You can still save â€”
              you will be asked to confirm.
            </BodyText>
          </Box>
        );
      })()}
      <BookingDrawerParticipantActions
        kinds={drawerParticipantKinds}
        nameFieldOpen={showInlineGuestField && !editingInlineGuestId}
        onAddGuest={() => {
          beginExistingBookingEdit();
          openInlineGuestForm("guest");
        }}
        onAddModel={() => {
          beginExistingBookingEdit();
          // IC DL never shows this kind; keep guest semantics if it does.
          openInlineGuestForm(
            isSelectedCompanyClient ? "model" : "guest",
          );
        }}
        onAddGuestModel={() => {
          beginExistingBookingEdit();
          openInlineGuestForm(
            isSelectedCompanyClient ? "model" : "guest",
          );
        }}
        onAddPlanning={() => {
          beginExistingBookingEdit();
          addDlParticipant("planning");
        }}
        onAddBuffer={() => {
          beginExistingBookingEdit();
          addDlParticipant("buffer");
        }}
      />
    </Box>
  );
}
